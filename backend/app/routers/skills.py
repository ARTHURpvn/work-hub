import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.skill import (
    MigrarErro,
    MigrarResultado,
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
    skill_remota_service,
    skill_service,
    uso_service,
)

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


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

    api_key, _ = await config_service.get_anthropic(session)
    display_title = body.display_title.strip() or name
    try:
        res = await skill_api_service.criar(api_key, display_title, body.conteudo)
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
    return SkillDetalhe.model_validate(row)


@router.get("/{rid}", response_model=SkillDetalhe)
async def get_skill(
    rid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillDetalhe:
    row = await skill_remota_service.obter(session, rid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    return SkillDetalhe.model_validate(row)


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

    api_key, _ = await config_service.get_anthropic(session)
    try:
        versao = await skill_api_service.nova_versao(api_key, row.skill_id, body.conteudo)
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
    return SkillDetalhe.model_validate(row)


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
    mensagens = [m.model_dump() for m in body.mensagens]
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        if token:
            resultado = await claude_cli_service.chat(token, row.conteudo, mensagens)
        else:
            resultado = await skill_service.chat(row.conteudo, mensagens, api_key=api_key, model=model)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    u = resultado.pop("usage", None) or {}
    await uso_service.registrar(session, "chat", u.get("model", model), u.get("input_tokens", 0), u.get("output_tokens", 0))
    return SkillChatResponse(**resultado)
