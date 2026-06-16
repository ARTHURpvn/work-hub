"""CRUD de subagents + serialização para .md + espelho local (~/.claude/agents).

Formato oficial do Claude Code: arquivo Markdown com frontmatter YAML
(name, description, tools?, model?) e corpo = system prompt.
"""
import json
import re
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.subagent import Subagent

NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")
MODELOS = {"inherit", "haiku", "sonnet", "opus", "fable"}


def validar_name(name: str) -> str:
    n = (name or "").strip()
    if not NAME_RE.match(n):
        raise ValueError("`name` do subagent: só minúsculas, números e hífens (máx. 64).")
    return n


def montar_md(name: str, description: str, model: str | None, tools: str | None, system_prompt: str) -> str:
    """Gera o .md do subagent com frontmatter YAML válido (description entre aspas)."""
    linhas = [
        "---",
        f"name: {json.dumps(name, ensure_ascii=False)}",
        f"description: {json.dumps(description or '', ensure_ascii=False)}",
    ]
    if tools and tools.strip():
        linhas.append(f"tools: {tools.strip()}")
    if model and model.strip() and model.strip() != "inherit":
        linhas.append(f"model: {model.strip()}")
    linhas.append("---")
    linhas.append("")
    linhas.append((system_prompt or "").strip())
    return "\n".join(linhas) + "\n"


def espelhar_local(row: Subagent) -> None:
    """Escreve ~/.claude/agents/<name>.md. Best-effort (chamador trata exceção)."""
    base = Path(settings.agents_dir)
    base.mkdir(parents=True, exist_ok=True)
    (base / f"{row.name}.md").write_text(
        montar_md(row.name, row.description, row.model, row.tools, row.system_prompt),
        encoding="utf-8",
    )


def remover_local(name: str) -> None:
    if not NAME_RE.match(name or ""):
        return
    alvo = Path(settings.agents_dir) / f"{name}.md"
    if alvo.is_file():
        alvo.unlink()


async def listar(session: AsyncSession) -> list[Subagent]:
    result = await session.execute(select(Subagent).order_by(Subagent.atualizado_em.desc()))
    return list(result.scalars())


async def obter(session: AsyncSession, sid: uuid.UUID) -> Subagent | None:
    return await session.get(Subagent, sid)


async def por_name(session: AsyncSession, name: str) -> Subagent | None:
    result = await session.execute(select(Subagent).where(Subagent.name == name))
    return result.scalars().first()


async def criar(
    session: AsyncSession,
    *,
    name: str,
    description: str,
    model: str,
    tools: str | None,
    system_prompt: str,
    color: str | None,
) -> Subagent:
    row = Subagent(
        name=name,
        description=description,
        model=model or "inherit",
        tools=(tools or None),
        system_prompt=system_prompt,
        color=color,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def atualizar(session: AsyncSession, row: Subagent, **campos) -> Subagent:
    for chave, valor in campos.items():
        if valor is not None:
            setattr(row, chave, valor)
    await session.commit()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Subagent) -> None:
    await session.delete(row)
    await session.commit()


# ---------- Melhoria por IA (reusa CLI/streaming ou API) ----------
_PROMPT = (
    "Você é especialista em subagents do Claude Code. Aprimore o subagent abaixo: "
    "melhore a `description` (3ª pessoa, começando com 'Use quando...' e com gatilhos concretos — "
    "é o que decide a delegação automática) e o SYSTEM PROMPT (objetivo, acionável, com o passo a passo "
    "de como o subagent deve agir). Responda APENAS um JSON válido, sem texto fora dele:\n"
    '{"description": "<nova description>", "system_prompt": "<novo system prompt>"}\n\n'
)


def _parse(texto: str) -> dict:
    try:
        ini, fim = texto.find("{"), texto.rfind("}")
        if ini != -1 and fim != -1:
            dados = json.loads(texto[ini : fim + 1])
            d = dados.get("description")
            sp = dados.get("system_prompt")
            return {
                "description": d if isinstance(d, str) and d.strip() else None,
                "system_prompt": sp if isinstance(sp, str) and sp.strip() else None,
            }
    except (json.JSONDecodeError, ValueError):
        pass
    return {"description": None, "system_prompt": None}


async def melhorar(
    row: Subagent,
    *,
    token: str | None,
    api_key: str = "",
    model: str = "",
) -> dict:
    contexto = (
        f"name: {row.name}\nmodel: {row.model}\ntools: {row.tools or '(todas)'}\n"
        f"description atual: {row.description}\n\nsystem prompt atual:\n{row.system_prompt}"
    )
    prompt = _PROMPT + contexto
    if token:
        from app.services import claude_cli_service

        texto = await claude_cli_service.gerar(token, prompt)
        return _parse(texto)

    api_key = api_key or settings.anthropic_api_key
    model = model or settings.anthropic_model
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações")
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    msg = await client.messages.create(
        model=model, max_tokens=4000, messages=[{"role": "user", "content": prompt}]
    )
    texto = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()
    return _parse(texto)
