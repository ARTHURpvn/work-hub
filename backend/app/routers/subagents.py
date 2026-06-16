import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.subagent import (
    SubagentCreate,
    SubagentMelhoria,
    SubagentResponse,
    SubagentUpdate,
)
from app.services import config_service, subagent_service, uso_service

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def _espelhar(row) -> None:
    try:
        subagent_service.espelhar_local(row)
    except Exception as exc:  # noqa: BLE001
        print(f"[subagents] falha ao espelhar '{row.name}': {exc}", flush=True)


@router.get("", response_model=list[SubagentResponse])
async def list_subagents(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SubagentResponse]:
    rows = await subagent_service.listar(session)
    return [SubagentResponse.model_validate(r) for r in rows]


@router.post("", response_model=SubagentResponse, status_code=status.HTTP_201_CREATED)
async def create_subagent(
    body: SubagentCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubagentResponse:
    try:
        name = subagent_service.validar_name(body.name)
    except ValueError as exc:
        raise _bad(str(exc))
    if not body.description.strip():
        raise _bad("Descrição é obrigatória.")
    if not body.system_prompt.strip():
        raise _bad("System prompt é obrigatório.")
    if await subagent_service.por_name(session, name):
        raise _bad(f"Já existe um subagent '{name}'.")
    row = await subagent_service.criar(
        session,
        name=name,
        description=body.description.strip(),
        model=body.model or "inherit",
        tools=(body.tools.strip() if body.tools else None),
        system_prompt=body.system_prompt,
        color=body.color,
    )
    _espelhar(row)
    return SubagentResponse.model_validate(row)


@router.get("/{sid}", response_model=SubagentResponse)
async def get_subagent(
    sid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubagentResponse:
    row = await subagent_service.obter(session, sid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subagent não encontrado")
    return SubagentResponse.model_validate(row)


@router.put("/{sid}", response_model=SubagentResponse)
async def update_subagent(
    sid: uuid.UUID,
    body: SubagentUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubagentResponse:
    row = await subagent_service.obter(session, sid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subagent não encontrado")
    await subagent_service.atualizar(
        session,
        row,
        description=(body.description.strip() if body.description else None),
        model=body.model,
        tools=(body.tools.strip() if body.tools is not None else None),
        system_prompt=body.system_prompt,
        color=body.color,
    )
    _espelhar(row)
    return SubagentResponse.model_validate(row)


@router.delete("/{sid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subagent(
    sid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await subagent_service.obter(session, sid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subagent não encontrado")
    nome = row.name
    await subagent_service.excluir(session, row)
    try:
        subagent_service.remover_local(nome)
    except Exception as exc:  # noqa: BLE001
        print(f"[subagents] falha ao remover '{nome}': {exc}", flush=True)


@router.post("/{sid}/melhorar", response_model=SubagentMelhoria)
async def melhorar_subagent(
    sid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubagentMelhoria:
    row = await subagent_service.obter(session, sid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subagent não encontrado")
    token = await config_service.get_claude_code_token(session)
    api_key, model = await config_service.get_anthropic(session)
    try:
        resultado = await subagent_service.melhorar(row, token=token, api_key=api_key, model=model)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    await uso_service.registrar(session, "subagent-melhorar", "claude-code" if token else model, 0, 0)
    return SubagentMelhoria(**resultado)
