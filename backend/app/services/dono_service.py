import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dono import Dono
from app.models.projeto import Projeto


async def listar(session: AsyncSession) -> list[dict]:
    """Lista donos com contagem de projetos e de VPS distintas usadas por eles."""
    donos = (await session.execute(select(Dono).order_by(Dono.nome))).scalars().all()
    rows = await session.execute(
        select(
            Projeto.origem,
            func.count(Projeto.id),
            func.count(func.distinct(Projeto.vps_id)),  # count ignora NULL
        ).group_by(Projeto.origem)
    )
    counts = {origem: (pc, vc) for origem, pc, vc in rows.all()}
    return [
        {
            "id": d.id,
            "nome": d.nome,
            "criado_em": d.criado_em,
            "projetos_count": counts.get(d.nome, (0, 0))[0],
            "vps_count": counts.get(d.nome, (0, 0))[1],
        }
        for d in donos
    ]


async def por_nome(session: AsyncSession, nome: str) -> Dono | None:
    return (await session.execute(select(Dono).where(Dono.nome == nome))).scalar_one_or_none()


async def criar(session: AsyncSession, nome: str) -> Dono:
    nome = nome.strip()
    if not nome:
        raise ValueError("nome do dono é obrigatório")
    if len(nome) > 64:
        raise ValueError("nome do dono é muito longo (máx 64)")
    if await por_nome(session, nome):
        raise ValueError(f"já existe um dono '{nome}'")
    dono = Dono(nome=nome, criado_em=datetime.now(tz=timezone.utc))
    session.add(dono)
    await session.flush()
    return dono


async def excluir(session: AsyncSession, dono_id: uuid.UUID) -> bool:
    dono = await session.get(Dono, dono_id)
    if dono is None:
        return False
    em_uso = (
        await session.execute(select(func.count(Projeto.id)).where(Projeto.origem == dono.nome))
    ).scalar_one()
    if em_uso:
        raise ValueError(f"'{dono.nome}' tem {em_uso} projeto(s) vinculado(s); reatribua antes de excluir")
    await session.delete(dono)
    await session.flush()
    return True
