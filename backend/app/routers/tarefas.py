import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.tarefa import TarefaCreate, TarefaResponse, TarefaStatusUpdate, TarefaUpdate
from app.services import tarefa_service

router = APIRouter()


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
