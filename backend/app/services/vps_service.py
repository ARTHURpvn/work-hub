import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.projeto import Projeto
from app.models.vps import Vps
from app.schemas.vps import VpsCreate, VpsUpdate


async def list_vps(session: AsyncSession) -> list[Vps]:
    result = await session.execute(
        select(Vps).options(selectinload(Vps.projetos)).order_by(Vps.criado_em.desc())
    )
    return list(result.scalars().all())


async def get_vps(session: AsyncSession, vps_id: uuid.UUID) -> Vps | None:
    result = await session.execute(
        select(Vps).options(selectinload(Vps.projetos)).where(Vps.id == vps_id)
    )
    return result.scalar_one_or_none()


async def create_vps(session: AsyncSession, data: VpsCreate) -> Vps:
    vps = Vps(
        nome=data.nome,
        ip=data.ip,
        provedor=data.provedor,
        criado_em=datetime.now(tz=timezone.utc),
    )
    session.add(vps)
    await session.flush()
    await session.refresh(vps, ["projetos"])
    return vps


async def update_vps(session: AsyncSession, vps: Vps, data: VpsUpdate) -> Vps:
    patch = data.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(vps, field, value)
    await session.flush()
    await session.refresh(vps, ["projetos"])
    return vps


async def set_projetos(
    session: AsyncSession, vps_id: uuid.UUID, projeto_ids: list[uuid.UUID]
) -> None:
    """Define os projetos que rodam nesta VPS.

    Seta `vps_id` nos projetos da lista (movendo quem estava em outra VPS) e
    limpa (`NULL`) nos que estavam ligados a esta VPS e saíram. Transação única.
    """
    if projeto_ids:
        result = await session.execute(select(Projeto.id).where(Projeto.id.in_(projeto_ids)))
        encontrados = set(result.scalars().all())
        faltando = set(projeto_ids) - encontrados
        if faltando:
            raise ValueError(f"projeto(s) inexistente(s): {', '.join(str(i) for i in faltando)}")

    # desvincula os que saíram da lista (in_([]) trata lista vazia => desvincula todos)
    await session.execute(
        update(Projeto)
        .where(Projeto.vps_id == vps_id, Projeto.id.notin_(projeto_ids))
        .values(vps_id=None)
    )
    if projeto_ids:
        await session.execute(
            update(Projeto).where(Projeto.id.in_(projeto_ids)).values(vps_id=vps_id)
        )
    await session.flush()


async def delete_vps(session: AsyncSession, vps_id: uuid.UUID) -> bool:
    """Remove a VPS. Projetos vinculados têm vps_id setado para NULL (ON DELETE SET NULL)."""
    vps = await get_vps(session, vps_id)
    if vps is None:
        return False
    await session.delete(vps)
    await session.flush()
    return True
