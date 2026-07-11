import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.credencial import CredencialResponse, CredencialReveal, CredencialUpsert
from app.schemas.projeto import (
    BriefUpdate,
    GerarDescricaoRequest,
    GerarDescricaoResponse,
    IdeiaChatMsg,
    IdeiaChatRequest,
    MembroCreate,
    MembroResponse,
    ProjetoCreate,
    ProjetoResponse,
    ProjetoUpdate,
)
from app.services import (
    config_service,
    credencial_service,
    github_service,
    ideia_service,
    projeto_service,
    skill_remota_service,
    uso_service,
)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

router = APIRouter()


@router.post("/gerar-descricao", response_model=GerarDescricaoResponse)
async def gerar_descricao(
    body: GerarDescricaoRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> GerarDescricaoResponse:
    gh_token = await config_service.get_valor(session, "GITHUB_TOKEN")
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        contexto = await github_service.buscar_contexto(body.github_url, gh_token)
        descricao = await projeto_service.gerar_descricao(
            contexto, token=token, api_key=api_key, model=model
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).exception("Falha ao gerar descrição de projeto")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Erro ao gerar descrição. Verifique os logs do servidor.",
        )
    await uso_service.registrar(
        session, "projeto-gerar-descricao", "claude-code" if token else model, 0, 0
    )
    return GerarDescricaoResponse(descricao=descricao)


async def _get_projeto_ou_404(session: AsyncSession, projeto_id: uuid.UUID):
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    return projeto


@router.get("", response_model=list[ProjetoResponse])
async def list_projetos(
    origem: str | None = Query(None),
    arquivado: bool | None = Query(None),
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProjetoResponse]:
    projetos = await projeto_service.list_projetos(session, origem=origem, arquivado=arquivado)
    return [ProjetoResponse.model_validate(p) for p in projetos]


@router.post("", response_model=ProjetoResponse, status_code=status.HTTP_201_CREATED)
async def create_projeto(
    body: ProjetoCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.create_projeto(session, body)
    await session.commit()
    return ProjetoResponse.model_validate(projeto)


@router.get("/{projeto_id}", response_model=ProjetoResponse)
async def get_projeto(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    return ProjetoResponse.model_validate(projeto)


@router.patch("/{projeto_id}", response_model=ProjetoResponse)
async def update_projeto(
    projeto_id: uuid.UUID,
    body: ProjetoUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    projeto = await projeto_service.update_projeto(session, projeto, body)
    await session.commit()
    return ProjetoResponse.model_validate(projeto)


@router.post("/{projeto_id}/membros", response_model=MembroResponse, status_code=status.HTTP_201_CREATED)
async def add_membro(
    projeto_id: uuid.UUID,
    body: MembroCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MembroResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    membro = await projeto_service.add_membro(session, projeto, body)
    await session.commit()
    return MembroResponse.model_validate(membro)


@router.delete("/{projeto_id}/membros/{membro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_membro(
    projeto_id: uuid.UUID,
    membro_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await projeto_service.remove_membro(session, projeto_id, membro_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro não encontrado")
    await session.commit()


# --- Credencial de login do site (1 por projeto, senha cifrada) ---


@router.get("/{projeto_id}/credencial", response_model=CredencialResponse)
async def get_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialResponse:
    cred = await credencial_service.get_credencial(session, projeto_id)
    if cred is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    return CredencialResponse(
        projeto_id=cred.projeto_id, usuario=cred.usuario, atualizado_em=cred.atualizado_em
    )


@router.put("/{projeto_id}/credencial", response_model=CredencialResponse)
async def upsert_credencial(
    projeto_id: uuid.UUID,
    body: CredencialUpsert,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialResponse:
    await _get_projeto_ou_404(session, projeto_id)
    cred = await credencial_service.upsert_credencial(session, projeto_id, body.usuario, body.senha)
    await session.commit()
    return CredencialResponse(
        projeto_id=cred.projeto_id, usuario=cred.usuario, atualizado_em=cred.atualizado_em
    )


@router.get("/{projeto_id}/credencial/revelar", response_model=CredencialReveal)
async def revelar_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialReveal:
    cred = await credencial_service.get_credencial(session, projeto_id)
    if cred is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    senha = await credencial_service.reveal_senha(cred)
    return CredencialReveal(usuario=cred.usuario, senha=senha)


@router.delete("/{projeto_id}/credencial", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await credencial_service.delete_credencial(session, projeto_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    await session.commit()


# ---- Ideia: brief ("o que o projeto precisa ter") + chat de co-escrita com IA ----


@router.put("/{projeto_id}/brief", response_model=ProjetoResponse)
async def salvar_brief(
    projeto_id: uuid.UUID,
    body: BriefUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await _get_projeto_ou_404(session, projeto_id)
    projeto = await ideia_service.salvar_brief(session, projeto, body.brief)
    return ProjetoResponse.model_validate(projeto)


@router.get("/{projeto_id}/chat", response_model=list[IdeiaChatMsg])
async def get_ideia_chat(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[IdeiaChatMsg]:
    await _get_projeto_ou_404(session, projeto_id)
    msgs = await ideia_service.listar_chat(session, projeto_id)
    return [IdeiaChatMsg.model_validate(m) for m in msgs]


@router.delete("/{projeto_id}/chat", status_code=status.HTTP_204_NO_CONTENT)
async def limpar_ideia_chat(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    await _get_projeto_ou_404(session, projeto_id)
    await ideia_service.limpar_chat(session, projeto_id)


@router.post("/{projeto_id}/chat/stream")
async def ideia_chat_stream(
    projeto_id: uuid.UUID,
    body: IdeiaChatRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> StreamingResponse:
    """SSE: persiste a mensagem do usuário, transmite a resposta da IA e a persiste no fim.

    Eventos: `status` (fase/elapsed/chars), `done` ({reply}), `error` ({detail}).
    """
    projeto = await _get_projeto_ou_404(session, projeto_id)
    nova = (body.mensagem or "").strip()
    if not nova:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Mensagem vazia")

    historico = await ideia_service.listar_chat(session, projeto_id)
    hist = [{"role": m.role, "content": m.content} for m in historico]
    await ideia_service.adicionar(session, projeto_id, "user", nova)

    # contexto: todas as anotações (briefs/descrições) + skills do usuário
    notas = await ideia_service.contexto_notas(session, projeto_id)
    skill_rows = await skill_remota_service.listar(session)
    skills = [
        {"name": r.name, "display_title": r.display_title, "descricao": r.descricao}
        for r in skill_rows
    ]

    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)

    async def gen():
        reply = ""
        try:
            async for ev in ideia_service.assistente_stream(
                projeto, hist, nova, notas=notas, skills=skills, token=token, api_key=api_key, model=model
            ):
                if ev.get("type") == "status":
                    yield _sse("status", ev)
                elif ev.get("type") == "done":
                    reply = (ev.get("data") or {}).get("reply", "")
                    if reply.strip():
                        await ideia_service.adicionar(session, projeto_id, "assistant", reply)
                    await uso_service.registrar(
                        session, "ideia-chat", "claude-code" if token else model, 0, 0
                    )
                    yield _sse("done", {"reply": reply})
        except ValueError as exc:
            yield _sse("error", {"detail": str(exc)})
        except Exception as exc:  # noqa: BLE001
            logging.getLogger(__name__).exception("Falha no chat da ideia")
            yield _sse("error", {"detail": f"Erro ao chamar a IA: {exc}"})

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )
