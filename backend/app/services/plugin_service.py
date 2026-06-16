"""CRUD de plugins (tabela plugin + join plugin_skill)."""
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hook import PluginHook
from app.models.mcp_server import PluginMcp
from app.models.plugin import Plugin, PluginSkill
from app.models.subagent import PluginSubagent


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


async def subagent_ids(session: AsyncSession, plugin_id: uuid.UUID) -> list[uuid.UUID]:
    result = await session.execute(
        select(PluginSubagent.subagent_id).where(PluginSubagent.plugin_id == plugin_id)
    )
    return [r[0] for r in result.all()]


async def _set_subagents(session: AsyncSession, plugin_id: uuid.UUID, ids: list[uuid.UUID]) -> None:
    await session.execute(delete(PluginSubagent).where(PluginSubagent.plugin_id == plugin_id))
    for sid in dict.fromkeys(ids):
        session.add(PluginSubagent(plugin_id=plugin_id, subagent_id=sid))


async def mcp_ids(session: AsyncSession, plugin_id: uuid.UUID) -> list[uuid.UUID]:
    result = await session.execute(
        select(PluginMcp.mcp_server_id).where(PluginMcp.plugin_id == plugin_id)
    )
    return [r[0] for r in result.all()]


async def _set_mcps(session: AsyncSession, plugin_id: uuid.UUID, ids: list[uuid.UUID]) -> None:
    await session.execute(delete(PluginMcp).where(PluginMcp.plugin_id == plugin_id))
    for mid in dict.fromkeys(ids):
        session.add(PluginMcp(plugin_id=plugin_id, mcp_server_id=mid))


async def hook_ids(session: AsyncSession, plugin_id: uuid.UUID) -> list[uuid.UUID]:
    result = await session.execute(
        select(PluginHook.hook_id).where(PluginHook.plugin_id == plugin_id)
    )
    return [r[0] for r in result.all()]


async def _set_hooks(session: AsyncSession, plugin_id: uuid.UUID, ids: list[uuid.UUID]) -> None:
    await session.execute(delete(PluginHook).where(PluginHook.plugin_id == plugin_id))
    for hid in dict.fromkeys(ids):
        session.add(PluginHook(plugin_id=plugin_id, hook_id=hid))


async def criar(
    session: AsyncSession,
    *,
    name: str,
    display_title: str,
    descricao: str | None,
    version: str,
    ids: list[uuid.UUID],
    sub_ids: list[uuid.UUID] | None = None,
    mcp_ids_: list[uuid.UUID] | None = None,
    hook_ids_: list[uuid.UUID] | None = None,
) -> Plugin:
    row = Plugin(name=name, display_title=display_title, descricao=descricao, version=version)
    session.add(row)
    await session.flush()
    await _set_skills(session, row.id, ids)
    await _set_subagents(session, row.id, sub_ids or [])
    await _set_mcps(session, row.id, mcp_ids_ or [])
    await _set_hooks(session, row.id, hook_ids_ or [])
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(
    session: AsyncSession,
    row: Plugin,
    *,
    ids: list[uuid.UUID] | None = None,
    sub_ids: list[uuid.UUID] | None = None,
    mcp_ids_: list[uuid.UUID] | None = None,
    hook_ids_: list[uuid.UUID] | None = None,
    **campos,
) -> Plugin:
    for chave, valor in campos.items():
        if valor is not None:
            setattr(row, chave, valor)
    if ids is not None:
        await _set_skills(session, row.id, ids)
    if sub_ids is not None:
        await _set_subagents(session, row.id, sub_ids)
    if mcp_ids_ is not None:
        await _set_mcps(session, row.id, mcp_ids_)
    if hook_ids_ is not None:
        await _set_hooks(session, row.id, hook_ids_)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Plugin) -> None:
    await session.delete(row)
    await session.commit()
