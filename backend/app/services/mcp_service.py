"""CRUD de MCP servers + cifragem de segredos + bloco para o .mcp.json do plugin.

Segredos (env/headers com secret=True) são cifrados em repouso (crypto_service),
NUNCA retornados em claro pela API (mascarados) e NUNCA exportados — viram ${KEY}.
"""
import re
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mcp_server import McpServer, SkillMcp
from app.services import crypto_service

NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")
TRANSPORTES = {"stdio", "http"}


def validar_name(name: str) -> str:
    n = (name or "").strip()
    if not NAME_RE.match(n):
        raise ValueError("`name` do MCP: só minúsculas, números e hífens (máx. 64).")
    return n


def _cifrar_pares(pares: list[dict] | None, antigos: list[dict] | None = None) -> list[dict]:
    """Normaliza/cifra uma lista de {key, value, secret} para armazenar.

    Em update, um par secret com value vazio PRESERVA o valor cifrado antigo (por key)
    — assim o usuário edita sem precisar redigitar o segredo.
    """
    antigos_por_key = {a["key"]: a for a in (antigos or []) if a.get("key")}
    saida: list[dict] = []
    for p in pares or []:
        key = (p.get("key") or "").strip()
        if not key:
            continue
        secret = bool(p.get("secret"))
        value = p.get("value")
        if not secret:
            saida.append({"key": key, "value": value or "", "secret": False})
            continue
        if value:  # novo segredo informado → cifra
            saida.append({"key": key, "value": crypto_service.encrypt(value), "secret": True})
        elif key in antigos_por_key and antigos_por_key[key].get("secret"):
            saida.append({"key": key, "value": antigos_por_key[key].get("value", ""), "secret": True})
        else:
            saida.append({"key": key, "value": "", "secret": True})  # segredo vazio (placeholder)
    return saida


def mascarar(pares: list[dict] | None) -> list[dict]:
    """Para a API: nunca devolve valor de segredo (só a key + flag)."""
    out = []
    for p in pares or []:
        if p.get("secret"):
            out.append({"key": p["key"], "value": "", "secret": True})
        else:
            out.append({"key": p["key"], "value": p.get("value", ""), "secret": False})
    return out


def _pares_para_dict_export(pares: list[dict] | None) -> dict:
    """env/headers para o .mcp.json: secret → ${KEY}; não-secret → valor literal."""
    d = {}
    for p in pares or []:
        key = p.get("key")
        if not key:
            continue
        d[key] = f"${{{key}}}" if p.get("secret") else p.get("value", "")
    return d


def bloco_export(server: McpServer) -> dict:
    """Bloco do server para o mcpServers do .mcp.json (sem segredos reais)."""
    if server.transport == "http":
        bloco: dict = {"type": "http", "url": server.url or ""}
        headers = _pares_para_dict_export(server.headers)
        if headers:
            bloco["headers"] = headers
    else:
        bloco = {"type": "stdio", "command": server.command or ""}
        if server.args:
            bloco["args"] = server.args
        env = _pares_para_dict_export(server.env)
        if env:
            bloco["env"] = env
    return bloco


async def listar(session: AsyncSession) -> list[McpServer]:
    result = await session.execute(select(McpServer).order_by(McpServer.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, mid: uuid.UUID) -> McpServer | None:
    return await session.get(McpServer, mid)


async def por_name(session: AsyncSession, name: str) -> McpServer | None:
    result = await session.execute(select(McpServer).where(McpServer.name == name))
    return result.scalars().first()


async def criar(
    session: AsyncSession,
    *,
    name: str,
    transport: str,
    command: str | None,
    args: list | None,
    url: str | None,
    env: list[dict] | None,
    headers: list[dict] | None,
    descricao: str | None,
) -> McpServer:
    row = McpServer(
        name=name,
        transport=transport,
        command=command,
        args=args or None,
        url=url,
        env=_cifrar_pares(env),
        headers=_cifrar_pares(headers),
        descricao=descricao,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(
    session: AsyncSession,
    row: McpServer,
    *,
    transport: str | None = None,
    command: str | None = None,
    args: list | None = None,
    url: str | None = None,
    env: list[dict] | None = None,
    headers: list[dict] | None = None,
    descricao: str | None = None,
) -> McpServer:
    if transport is not None:
        row.transport = transport
    if command is not None:
        row.command = command
    if args is not None:
        row.args = args or None
    if url is not None:
        row.url = url
    if env is not None:
        row.env = _cifrar_pares(env, row.env)
    if headers is not None:
        row.headers = _cifrar_pares(headers, row.headers)
    if descricao is not None:
        row.descricao = descricao
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: McpServer) -> None:
    await session.delete(row)
    await session.commit()


# ---------- vínculo skill_mcp (a skill que ensina a usar o MCP) ----------
async def skill_ids(session: AsyncSession, mcp_id: uuid.UUID) -> list[uuid.UUID]:
    result = await session.execute(
        select(SkillMcp.skill_remota_id).where(SkillMcp.mcp_server_id == mcp_id)
    )
    return [r[0] for r in result.all()]


async def set_skills(session: AsyncSession, mcp_id: uuid.UUID, ids: list[uuid.UUID]) -> None:
    await session.execute(delete(SkillMcp).where(SkillMcp.mcp_server_id == mcp_id))
    for sid in dict.fromkeys(ids):
        session.add(SkillMcp(skill_remota_id=sid, mcp_server_id=mcp_id))
    await session.commit()
