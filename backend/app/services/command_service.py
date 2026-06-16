"""CRUD de slash commands + serialização .md + espelho local (~/.claude/commands)."""
import json
import re
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.command import Command

NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")


def validar_name(name: str) -> str:
    n = (name or "").strip()
    if not NAME_RE.match(n):
        raise ValueError("`name` do command: só minúsculas, números e hífens (máx. 64).")
    return n


def montar_md(
    descricao: str | None,
    argument_hint: str | None,
    model: str | None,
    allowed_tools: str | None,
    conteudo: str,
) -> str:
    """Gera o .md do command com frontmatter YAML válido (description entre aspas)."""
    fm = []
    if descricao:
        fm.append(f"description: {json.dumps(descricao, ensure_ascii=False)}")
    if argument_hint:
        fm.append(f"argument-hint: {json.dumps(argument_hint, ensure_ascii=False)}")
    if allowed_tools and allowed_tools.strip():
        fm.append(f"allowed-tools: {allowed_tools.strip()}")
    if model and model.strip():
        fm.append(f"model: {model.strip()}")
    corpo = (conteudo or "").strip()
    if not fm:
        return corpo + "\n"
    return "---\n" + "\n".join(fm) + "\n---\n\n" + corpo + "\n"


def espelhar_local(row: Command) -> None:
    base = Path(settings.commands_dir)
    base.mkdir(parents=True, exist_ok=True)
    (base / f"{row.name}.md").write_text(
        montar_md(row.descricao, row.argument_hint, row.model, row.allowed_tools, row.conteudo),
        encoding="utf-8",
    )


def remover_local(name: str) -> None:
    if not NAME_RE.match(name or ""):
        return
    alvo = Path(settings.commands_dir) / f"{name}.md"
    if alvo.is_file():
        alvo.unlink()


async def listar(session: AsyncSession) -> list[Command]:
    result = await session.execute(select(Command).order_by(Command.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, cid: uuid.UUID) -> Command | None:
    return await session.get(Command, cid)


async def por_name(session: AsyncSession, name: str) -> Command | None:
    result = await session.execute(select(Command).where(Command.name == name))
    return result.scalars().first()


async def criar(
    session: AsyncSession,
    *,
    name: str,
    descricao: str | None,
    argument_hint: str | None,
    model: str | None,
    allowed_tools: str | None,
    conteudo: str,
) -> Command:
    row = Command(
        name=name,
        descricao=descricao,
        argument_hint=argument_hint,
        model=model,
        allowed_tools=allowed_tools,
        conteudo=conteudo,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(session: AsyncSession, row: Command, **campos) -> Command:
    for chave, valor in campos.items():
        if valor is not None:
            setattr(row, chave, valor)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Command) -> None:
    await session.delete(row)
    await session.commit()
