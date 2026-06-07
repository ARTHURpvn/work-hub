"""CRUD no banco do espelho local das skills custom (tabela skill_remota)."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_remota import SkillRemota


async def listar(session: AsyncSession) -> list[SkillRemota]:
    result = await session.execute(select(SkillRemota).order_by(SkillRemota.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, rid: uuid.UUID) -> SkillRemota | None:
    return await session.get(SkillRemota, rid)


async def por_name(session: AsyncSession, name: str) -> SkillRemota | None:
    result = await session.execute(select(SkillRemota).where(SkillRemota.name == name))
    return result.scalars().first()


async def criar(
    session: AsyncSession,
    *,
    skill_id: str,
    name: str,
    display_title: str,
    descricao: str | None,
    conteudo: str,
    versao_atual: str | None,
) -> SkillRemota:
    row = SkillRemota(
        skill_id=skill_id,
        name=name,
        display_title=display_title,
        descricao=descricao,
        conteudo=conteudo,
        versao_atual=versao_atual,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(session: AsyncSession, row: SkillRemota, **campos) -> SkillRemota:
    for chave, valor in campos.items():
        setattr(row, chave, valor)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: SkillRemota) -> None:
    await session.delete(row)
    await session.commit()
