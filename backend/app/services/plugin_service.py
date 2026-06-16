"""CRUD de plugins (tabela plugin + join plugin_skill)."""
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.plugin import Plugin, PluginSkill


async def listar(session: AsyncSession) -> list[Plugin]:
    result = await session.execute(select(Plugin).order_by(Plugin.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, pid: uuid.UUID) -> Plugin | None:
    return await session.get(Plugin, pid)


async def por_name(session: AsyncSession, name: str) -> Plugin | None:
    result = await session.execute(select(Plugin).where(Plugin.name == name))
    return result.scalars().first()


async def skill_ids(session: AsyncSession, plugin_id: uuid.UUID) -> list[uuid.UUID]:
    result = await session.execute(
        select(PluginSkill.skill_remota_id).where(PluginSkill.plugin_id == plugin_id)
    )
    return [r[0] for r in result.all()]


async def _set_skills(session: AsyncSession, plugin_id: uuid.UUID, ids: list[uuid.UUID]) -> None:
    await session.execute(delete(PluginSkill).where(PluginSkill.plugin_id == plugin_id))
    for sid in dict.fromkeys(ids):  # dedup preservando ordem
        session.add(PluginSkill(plugin_id=plugin_id, skill_remota_id=sid))


async def criar(
    session: AsyncSession,
    *,
    name: str,
    display_title: str,
    descricao: str | None,
    version: str,
    ids: list[uuid.UUID],
) -> Plugin:
    row = Plugin(name=name, display_title=display_title, descricao=descricao, version=version)
    session.add(row)
    await session.flush()
    await _set_skills(session, row.id, ids)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(
    session: AsyncSession,
    row: Plugin,
    *,
    ids: list[uuid.UUID] | None = None,
    **campos,
) -> Plugin:
    for chave, valor in campos.items():
        if valor is not None:
            setattr(row, chave, valor)
    if ids is not None:
        await _set_skills(session, row.id, ids)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Plugin) -> None:
    await session.delete(row)
    await session.commit()
