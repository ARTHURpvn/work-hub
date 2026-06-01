import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.tarefa import (
    SubtarefaCreate,
    SubtarefaResponse,
    SubtarefaUpdate,
    TarefaCreate,
    TarefaLinkCreate,
    TarefaLinkResponse,
    TarefaResponse,
    TarefaStatusUpdate,
    TarefaUpdate,
)
from app.services import tarefa_service

router = APIRouter()


async def _get_tarefa_ou_404(session: AsyncSession, tarefa_id: uuid.UUID):
    tarefa = await tarefa_service.get_tarefa(session, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    return tarefa


@router.get("", response_model=list[TarefaResponse])
async def list_tarefas(
    status: str | None = Query(None),
    projeto_id: uuid.UUID | None = Query(None),
    com_prazo: bool | None = Query(None),
    order_by: str = Query("criado_em", pattern="^(criado_em|prazo|prioridade)$"),
    order_dir: str = Query("desc", pattern="^(asc|desc)$"),
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[TarefaResponse]:
    tarefas = await tarefa_service.list_tarefas(
        session, status=status, projeto_id=projeto_id,
        com_prazo=com_prazo, order_by=order_by, order_dir=order_dir,
    )
    return [TarefaResponse.model_validate(t) for t in tarefas]


@router.post("", response_model=TarefaResponse, status_code=status.HTTP_201_CREATED)
async def create_tarefa(
    body: TarefaCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TarefaResponse:
    tarefa = await tarefa_service.create_tarefa(session, body)
    await session.commit()
    return TarefaResponse.model_validate(tarefa)


@router.patch("/{tarefa_id}", response_model=TarefaResponse)
async def update_tarefa(
    tarefa_id: uuid.UUID,
    body: TarefaUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TarefaResponse:
    tarefa = await tarefa_service.get_tarefa(session, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    tarefa = await tarefa_service.update_tarefa(session, tarefa, body)
    await session.commit()
    return TarefaResponse.model_validate(tarefa)


@router.patch("/{tarefa_id}/status", response_model=TarefaResponse)
async def update_status(
    tarefa_id: uuid.UUID,
    body: TarefaStatusUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TarefaResponse:
    tarefa = await tarefa_service.get_tarefa(session, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    tarefa = await tarefa_service.update_status(session, tarefa, body.status)
    await session.commit()
    return TarefaResponse.model_validate(tarefa)


@router.delete("/{tarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tarefa(
    tarefa_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    tarefa = await tarefa_service.get_tarefa(session, tarefa_id)
    if tarefa is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada")
    await tarefa_service.delete_tarefa(session, tarefa)
    await session.commit()


# --- Subtarefas (checklist) ---


@router.post("/{tarefa_id}/subtarefas", response_model=SubtarefaResponse, status_code=status.HTTP_201_CREATED)
async def add_subtarefa(
    tarefa_id: uuid.UUID,
    body: SubtarefaCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubtarefaResponse:
    tarefa = await _get_tarefa_ou_404(session, tarefa_id)
    sub = await tarefa_service.add_subtarefa(session, tarefa, body)
    await session.commit()
    return SubtarefaResponse.model_validate(sub)


@router.patch("/{tarefa_id}/subtarefas/{subtarefa_id}", response_model=SubtarefaResponse)
async def update_subtarefa(
    tarefa_id: uuid.UUID,
    subtarefa_id: uuid.UUID,
    body: SubtarefaUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SubtarefaResponse:
    sub = await tarefa_service.get_subtarefa(session, tarefa_id, subtarefa_id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtarefa não encontrada")
    sub = await tarefa_service.update_subtarefa(session, sub, body)
    await session.commit()
    return SubtarefaResponse.model_validate(sub)


@router.delete("/{tarefa_id}/subtarefas/{subtarefa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtarefa(
    tarefa_id: uuid.UUID,
    subtarefa_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    sub = await tarefa_service.get_subtarefa(session, tarefa_id, subtarefa_id)
    if sub is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subtarefa não encontrada")
    await tarefa_service.delete_subtarefa(session, sub)
    await session.commit()


# --- Links úteis ---


@router.post("/{tarefa_id}/links", response_model=TarefaLinkResponse, status_code=status.HTTP_201_CREATED)
async def add_link(
    tarefa_id: uuid.UUID,
    body: TarefaLinkCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> TarefaLinkResponse:
    tarefa = await _get_tarefa_ou_404(session, tarefa_id)
    link = await tarefa_service.add_link(session, tarefa, body)
    await session.commit()
    return TarefaLinkResponse.model_validate(link)


@router.delete("/{tarefa_id}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    tarefa_id: uuid.UUID,
    link_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await tarefa_service.delete_link(session, tarefa_id, link_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link não encontrado")
    await session.commit()
