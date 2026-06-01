import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.subtarefa import Subtarefa, TarefaLink
from app.models.tarefa import Tarefa
from app.schemas.tarefa import SubtarefaCreate, SubtarefaUpdate, TarefaCreate, TarefaLinkCreate, TarefaUpdate

_LOAD_RELS = (selectinload(Tarefa.subtarefas), selectinload(Tarefa.links))


async def list_tarefas(
    session: AsyncSession,
    status: str | None = None,
    projeto_id: uuid.UUID | None = None,
    com_prazo: bool | None = None,
    order_by: str = "criado_em",
    order_dir: str = "desc",
) -> list[Tarefa]:
    query = select(Tarefa).options(*_LOAD_RELS)
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
    result = await session.execute(
        select(Tarefa).options(*_LOAD_RELS).where(Tarefa.id == tarefa_id)
    )
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
    await session.refresh(tarefa, ["subtarefas", "links"])
    return tarefa


async def update_tarefa(session: AsyncSession, tarefa: Tarefa, data: TarefaUpdate) -> Tarefa:
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(tarefa, field, value)
    tarefa.atualizado_em = datetime.now(tz=timezone.utc)
    await session.flush()
    await session.refresh(tarefa, ["subtarefas", "links"])
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
    await session.refresh(tarefa, ["subtarefas", "links"])
    return tarefa


async def delete_tarefa(session: AsyncSession, tarefa: Tarefa) -> None:
    await session.delete(tarefa)
    await session.flush()


# --- Subtarefas ---


async def add_subtarefa(session: AsyncSession, tarefa: Tarefa, data: SubtarefaCreate) -> Subtarefa:
    ordem = len(tarefa.subtarefas)
    sub = Subtarefa(
        tarefa_id=tarefa.id,
        titulo=data.titulo,
        ordem=ordem,
        criado_em=datetime.now(tz=timezone.utc),
    )
    session.add(sub)
    await session.flush()
    return sub


async def get_subtarefa(
    session: AsyncSession, tarefa_id: uuid.UUID, subtarefa_id: uuid.UUID
) -> Subtarefa | None:
    result = await session.execute(
        select(Subtarefa).where(Subtarefa.id == subtarefa_id, Subtarefa.tarefa_id == tarefa_id)
    )
    return result.scalar_one_or_none()


async def update_subtarefa(
    session: AsyncSession, sub: Subtarefa, data: SubtarefaUpdate
) -> Subtarefa:
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(sub, field, value)
    await session.flush()
    return sub


async def delete_subtarefa(session: AsyncSession, sub: Subtarefa) -> None:
    await session.delete(sub)
    await session.flush()


# --- Links ---


async def add_link(session: AsyncSession, tarefa: Tarefa, data: TarefaLinkCreate) -> TarefaLink:
    link = TarefaLink(
        tarefa_id=tarefa.id,
        label=data.label,
        url=data.url,
        criado_em=datetime.now(tz=timezone.utc),
    )
    session.add(link)
    await session.flush()
    return link


async def delete_link(session: AsyncSession, tarefa_id: uuid.UUID, link_id: uuid.UUID) -> bool:
    result = await session.execute(
        select(TarefaLink).where(TarefaLink.id == link_id, TarefaLink.tarefa_id == tarefa_id)
    )
    link = result.scalar_one_or_none()
    if link is None:
        return False
    await session.delete(link)
    await session.flush()
    return True
