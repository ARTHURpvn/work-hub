"""CRUD de hooks + serialização para hooks/hooks.json (agrupado por evento/matcher).

O `command` é shell e NUNCA é executado pelo workhub — só serializado no bundle.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.hook import Hook

# eventos válidos do Claude Code (case-sensitive)
EVENTOS = {
    "PreToolUse", "PostToolUse", "PostToolUseFailure", "UserPromptSubmit", "Stop",
    "SubagentStart", "SubagentStop", "SessionStart", "SessionEnd", "Notification",
    "PreCompact", "PostCompact", "PermissionRequest", "FileChanged",
}


def validar_event(event: str) -> str:
    e = (event or "").strip()
    if e not in EVENTOS:
        raise ValueError(f"Evento inválido. Use um de: {', '.join(sorted(EVENTOS))}.")
    return e


def montar_hooks_json(hooks: list[dict]) -> dict:
    """Agrupa hooks no schema do Claude Code: {hooks: {Event: [{matcher, hooks:[...]}]}}."""
    por_evento: dict[str, dict[str, list]] = {}
    for h in hooks:
        ev = h["event"]
        matcher = (h.get("matcher") or "").strip() or "*"
        entrada = {"type": "command", "command": h["command"]}
        if h.get("timeout"):
            entrada["timeout"] = h["timeout"]
        por_evento.setdefault(ev, {}).setdefault(matcher, []).append(entrada)
    saida: dict[str, list] = {}
    for ev, matchers in por_evento.items():
        saida[ev] = [{"matcher": m, "hooks": entradas} for m, entradas in matchers.items()]
    return {"hooks": saida}


async def listar(session: AsyncSession) -> list[Hook]:
    result = await session.execute(select(Hook).order_by(Hook.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, hid: uuid.UUID) -> Hook | None:
    return await session.get(Hook, hid)


async def criar(
    session: AsyncSession,
    *,
    descricao: str | None,
    event: str,
    matcher: str | None,
    command: str,
    timeout: int | None,
) -> Hook:
    row = Hook(
        descricao=descricao,
        event=event,
        matcher=(matcher or None),
        command=command,
        timeout=timeout,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(session: AsyncSession, row: Hook, **campos) -> Hook:
    for chave, valor in campos.items():
        if valor is not None:
            setattr(row, chave, valor)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Hook) -> None:
    await session.delete(row)
    await session.commit()
