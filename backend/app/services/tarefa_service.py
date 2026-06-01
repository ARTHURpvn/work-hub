import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tarefa import Tarefa
from app.schemas.tarefa import TarefaCreate, TarefaUpdate


async def list_tarefas(
    session: AsyncSession,
    status: str | None = None,
    projeto_id: uuid.UUID | None = None,
    com_prazo: bool | None = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
) -> list[Tarefa]:
    query = select(Tarefa)
    if status is not None:
        query = query.where(Tarefa.status == status)
    if projeto_id is not None:
        query = query.where(Tarefa.projeto_id == projeto_id)
    if com_prazo is True:
        query = query.where(Tarefa.prazo.is_not(None))

    col = getattr(Tarefa, order_by, Tarefa.criado_em)
    query = query.order_by(col.desc() if order_dir == "desc" else col.asc())

    result = await session.execute(query)
    return list(result.scalars().all())


async def get_tarefa(session: AsyncSession, tarefa_id: uuid.UUID) -> Tarefa | None:
    result = await session.execute(select(Tarefa).where(Tarefa.id == tarefa_id))
    return result.scalar_one_or_none()


async def create_tarefa(session: AsyncSession, data: TarefaCreate) -> Tarefa:
    now = datetime.now(tz=timezone.utc)
    tarefa = Tarefa(
        titulo=data.titulo,
        descricao=data.descricao,
        prazo=data.prazo,
        prioridade=data.prioridade,
        projeto_id=data.projeto_id,
        status=data.status,
        publicavel=data.publicavel,
        criado_em=now,
        atualizado_em=now,
    )
    session.add(tarefa)
    await session.flush()
    return tarefa


async def update_tarefa(session: AsyncSession, tarefa: Tarefa, data: TarefaUpdate) -> Tarefa:
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(tarefa, field, value)
    tarefa.atualizado_em = datetime.now(tz=timezone.utc)
    await session.flush()
    return tarefa


async def update_status(session: AsyncSession, tarefa: Tarefa, new_status: str) -> Tarefa:
    old_status = tarefa.status

    # RN-02: saindo de Em Revisao para A Fazer ou Em Andamento
    if old_status == "Em Revisao" and new_status in ("A Fazer", "Em Andamento"):
        tarefa.revisao_retornos += 1
        tarefa.retornou_de_revisao = True

    # RN-02: chegando em Concluido desliga a flag
    if new_status == "Concluido":
        tarefa.retornou_de_revisao = False

    tarefa.status = new_status
    tarefa.atualizado_em = datetime.now(tz=timezone.utc)
    await session.flush()
    return tarefa


async def delete_tarefa(session: AsyncSession, tarefa: Tarefa) -> None:
    await session.delete(tarefa)
    await session.flush()
