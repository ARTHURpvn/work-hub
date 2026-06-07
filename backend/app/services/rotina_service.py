import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rotina import Rotina


async def listar(session: AsyncSession) -> list[Rotina]:
    result = await session.execute(select(Rotina).order_by(Rotina.criado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, rotina_id: uuid.UUID) -> Rotina | None:
    return await session.get(Rotina, rotina_id)


async def criar(session: AsyncSession, data: dict) -> Rotina:
    rotina = Rotina(**data)
    session.add(rotina)
    await session.commit()
    await session.refresh(rotina)
    return rotina


async def atualizar(session: AsyncSession, rotina_id: uuid.UUID, data: dict) -> Rotina | None:
    rotina = await session.get(Rotina, rotina_id)
    if rotina is None:
        return None
    for chave, valor in data.items():
        setattr(rotina, chave, valor)
    await session.commit()
    await session.refresh(rotina)
    return rotina


async def excluir(session: AsyncSession, rotina_id: uuid.UUID) -> bool:
    rotina = await session.get(Rotina, rotina_id)
    if rotina is None:
        return False
    await session.delete(rotina)
    await session.commit()
    return True
