import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.skill import (
    AssistenteRequest,
    AssistenteResponse,
    MigrarErro,
    MigrarResultado,
    SkillArquivoOut,
    SkillChatMsg,
    SkillChatRequest,
    SkillChatResponse,
    SkillCreate,
    SkillDetalhe,
    SkillMelhoria,
    SkillResponse,
    SkillUpdate,
)
from app.services import (
    claude_cli_service,
    config_service,
    skill_api_service,
    skill_arquivo_service,
    skill_assistant_service,
    skill_chat_service,
    skill_remota_service,
    skill_service,
    uso_service,
)

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def _espelhar_local(name: str, conteudo: str, arquivos: list[dict] | None = None) -> None:
    """Reflete a skill (SKILL.md + auxiliares) no ~/.claude/skills (Claude Code).
    Best-effort: nunca derruba o salvar na API se a escrita local falhar."""
    try:
        skill_service.espelhar_local(name, conteudo, arquivos)
    except Exception as exc:  # noqa: BLE001
        print(f"[skills] falha ao espelhar '{name}' no local: {exc}", flush=True)


async def _detalhe(session: AsyncSession, row) -> SkillDetalhe:
    """Monta SkillDetalhe com os arquivos auxiliares carregados do banco."""
    arqs = await skill_arquivo_service.listar(session, row.id)
    detalhe = SkillDetalhe.model_validate(row)
    detalhe.arquivos = [SkillArquivoOut.model_validate(a) for a in arqs]
    return detalhe


def _remover_local(name: str) -> None:
    try:
        skill_service.remover_local(name)
    except Exception as exc:  # noqa: BLE001
        print(f"[skills] falha ao remover '{name}' do local: {exc}", flush=True)


@router.get("", response_model=list[SkillResponse])
async def list_skills(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SkillResponse]:
    rows = await skill_remota_service.listar(session)
    return [SkillResponse.model_validate(r) for r in rows]


@router.post("", response_model=SkillDetalhe, status_code=status.HTTP_201_CREATED)
async def create_skill(
    body: SkillCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillDetalhe:
    try:
        name, descricao = skill_api_service.validar(body.conteudo)
    except ValueError as exc:
        raise _bad(str(exc))
    if await skill_remota_service.por_name(session, name):
        raise _bad(f"Já existe uma skill '{name}'.")

    arquivos = skill_arquivo_service.normalizar([a.model_dump() for a in body.arquivos])
    api_key, _ = await config_service.get_anthropic(session)
    display_title = body.display_title.strip() or name
    try:
        res = await skill_api_service.criar(api_key, display_title, body.conteudo, arquivos)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro na API de Skills: {exc}")

    row = await skill_remota_service.criar(
        session,
        skill_id=res["skill_id"],
        name=name,
        display_title=display_title,
        descricao=descricao,
        conteudo=body.conteudo,
        versao_atual=res["version"],
    )
    await skill_arquivo_service.substituir(session, row.id, arquivos)
    _espelhar_local(name, body.conteudo, arquivos)
    return await _detalhe(session, row)


@router.get("/{rid}", response_model=SkillDetalhe)
async def get_skill(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillDetalhe:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    return await _detalhe(session, row)


@router.put("/{rid}", response_model=SkillDetalhe)
async def update_skill(
    rid: uuid.UUID,
    body: SkillUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillDetalhe:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    try:
        name, descricao = skill_api_service.validar(body.conteudo)
    except ValueError as exc:
        raise _bad(str(exc))

    arquivos = skill_arquivo_service.normalizar([a.model_dump() for a in body.arquivos])
    api_key, _ = await config_service.get_anthropic(session)
    try:
        versao = await skill_api_service.nova_versao(api_key, row.skill_id, body.conteudo, arquivos)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro na API de Skills: {exc}")

    await skill_remota_service.atualizar(
        session,
        row,
        name=name,
        descricao=descricao,
        conteudo=body.conteudo,
        versao_atual=versao,
        display_title=(body.display_title.strip() if body.display_title else row.display_title),
    )
    await skill_arquivo_service.substituir(session, row.id, arquivos)
    _espelhar_local(name, body.conteudo, arquivos)
    return await _detalhe(session, row)


@router.delete("/{rid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    api_key, _ = await config_service.get_anthropic(session)
    try:
        await skill_api_service.excluir_remota(api_key, row.skill_id)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro na API de Skills: {exc}")
    await skill_remota_service.excluir(session, row)
    _remover_local(row.name)


@router.post("/migrar", response_model=MigrarResultado)
async def migrar_locais(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MigrarResultado:
    """Transcreve as skills pessoais (~/.claude/skills) para a API como custom."""
    api_key, _ = await config_service.get_anthropic(session)
    if not api_key:
        raise _bad("Chave da API Anthropic não configurada — defina em Configurações.")

    criadas = 0
    puladas = 0
    erros: list[MigrarErro] = []

    for slug in skill_service._md_paths("pessoal"):  # noqa: SLF001
        local = skill_service.obter("pessoal", slug)
        if local is None:
            continue
        conteudo = local["conteudo"]
        try:
            name, descricao = skill_api_service.validar(conteudo)
        except ValueError as exc:
            erros.append(MigrarErro(name=slug, erro=str(exc)))
            continue
        if await skill_remota_service.por_name(session, name):
            puladas += 1
            continue
        try:
            res = await skill_api_service.criar(api_key, local.get("name") or name, conteudo)
        except Exception as exc:  # noqa: BLE001
            erros.append(MigrarErro(name=name, erro=str(exc)))
            continue
        await skill_remota_service.criar(
            session,
            skill_id=res["skill_id"],
            name=name,
            display_title=local.get("name") or name,
            descricao=descricao,
            conteudo=conteudo,
            versao_atual=res["version"],
        )
        criadas += 1

    return MigrarResultado(criadas=criadas, puladas=puladas, erros=erros)


@router.post("/assistente/chat", response_model=AssistenteResponse)
async def assistente_chat(
    body: AssistenteRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> AssistenteResponse:
    rows = await skill_remota_service.listar(session)
    skills = [{"name": r.name, "display_title": r.display_title, "descricao": r.descricao} for r in rows]
    mensagens = [m.model_dump() for m in body.mensagens]
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        resultado = await skill_assistant_service.assistente(
            skills, mensagens, api_key=api_key, model=model, token=token
        )
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    u = {"model": "claude-code" if token else model}
    await uso_service.registrar(session, "assistente", u["model"], 0, 0)
    return AssistenteResponse(**resultado)


def _sse(evento: str, dados: dict) -> str:
    return f"event: {evento}\ndata: {json.dumps(dados, ensure_ascii=False)}\n\n"


@router.post("/assistente/chat/stream")
async def assistente_chat_stream(
    body: AssistenteRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """Versão streaming (SSE) do assistente: emite progresso + resultado final.

    Eventos: `status` (fase/elapsed/chars), `done` (reply/acoes), `error` (detail).
    """
    rows = await skill_remota_service.listar(session)
    skills = [{"name": r.name, "display_title": r.display_title, "descricao": r.descricao} for r in rows]
    mensagens = [m.model_dump() for m in body.mensagens]
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)

    async def gen():
        try:
            async for ev in skill_assistant_service.assistente_stream(
                skills, mensagens, api_key=api_key, model=model, token=token
            ):
                if ev["type"] == "status":
                    yield _sse("status", ev)
                elif ev["type"] == "done":
                    await uso_service.registrar(
                        session, "assistente", "claude-code" if token else model, 0, 0
                    )
                    n = len((ev.get("data") or {}).get("acoes") or [])
                    print(f"[assistente] done: {n} ação(ões) propostas", flush=True)
                    yield _sse("done", ev["data"])
        except ValueError as exc:
            yield _sse("error", {"detail": str(exc)})
        except Exception as exc:  # noqa: BLE001
            yield _sse("error", {"detail": f"Erro ao chamar a IA: {exc}"})

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@router.post("/{rid}/melhorar", response_model=SkillMelhoria)
async def melhorar_skill(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillMelhoria:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        if token:
            resultado = await claude_cli_service.melhorar(token, row.conteudo)
        else:
            resultado = await skill_service.melhorar(row.conteudo, api_key=api_key, model=model)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    u = resultado.get("usage") or {}
    await uso_service.registrar(session, "melhorar", u.get("model", model), u.get("input_tokens", 0), u.get("output_tokens", 0))
    return SkillMelhoria(sugestao=resultado["sugestao"])


@router.get("/{rid}/chat", response_model=list[SkillChatMsg])
async def get_chat(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SkillChatMsg]:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    msgs = await skill_chat_service.listar(session, rid)
    return [SkillChatMsg.model_validate(m) for m in msgs]


@router.delete("/{rid}/chat", status_code=status.HTTP_204_NO_CONTENT)
async def clear_chat(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    await skill_chat_service.limpar(session, rid)


@router.post("/{rid}/chat", response_model=SkillChatResponse)
async def chat_skill(
    rid: uuid.UUID,
    body: SkillChatRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillChatResponse:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    nova = body.mensagem.strip()
    if not nova:
        raise _bad("Mensagem vazia")

    # histórico salvo (apenas role/content como contexto) + a nova mensagem do usuário
    historico = await skill_chat_service.listar(session, rid)
    mensagens = [{"role": m.role, "content": m.content} for m in historico]
    mensagens.append({"role": "user", "content": nova})

    # auxiliares atuais como contexto para a IA
    arquivos_atuais = [
        {"caminho": a.caminho, "conteudo": a.conteudo}
        for a in await skill_arquivo_service.listar(session, rid)
    ]

    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        if token:
            resultado = await claude_cli_service.chat(token, row.conteudo, mensagens, arquivos_atuais)
        else:
            resultado = await skill_service.chat(
                row.conteudo, mensagens, api_key=api_key, model=model, arquivos=arquivos_atuais
            )
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")

    u = resultado.pop("usage", None) or {}
    await uso_service.registrar(session, "chat", u.get("model", model), u.get("input_tokens", 0), u.get("output_tokens", 0))

    # persiste a troca (usuário + assistente)
    await skill_chat_service.salvar(session, rid, "user", nova)
    await skill_chat_service.salvar(
        session,
        rid,
        "assistant",
        resultado["reply"],
        sugestao_conteudo=resultado.get("sugestao_conteudo"),
        demonstracao=resultado.get("demonstracao"),
        sugestao_arquivos=resultado.get("sugestao_arquivos"),
    )
    return SkillChatResponse(**resultado)
