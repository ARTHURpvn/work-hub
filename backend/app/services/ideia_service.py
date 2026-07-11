"""Ideia: brief ("o que o projeto precisa ter") + chat de co-escrita com IA.

O assistente conversa em PT-BR e ajuda a definir escopo/funcionalidades/stack.
Provider: CLI do Claude Code se houver token, senão SDK Anthropic (streaming SSE).
"""
import time
import uuid
from typing import AsyncIterator

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ideia_chat import IdeiaChat
from app.models.projeto import Projeto
from app.services import claude_cli_service

_SYSTEM = (
    "Você é um parceiro de produto e engenharia ajudando a transformar uma IDEIA de "
    "projeto num brief claro do que ele precisa ter. Converse em português do Brasil, "
    "direto e prático, sem enrolação.\n"
    "Ajude a definir: objetivo, público-alvo, funcionalidades essenciais (MVP) e futuras, "
    "requisitos técnicos, stack sugerida, integrações, riscos e próximos passos.\n"
    "Faça no máximo 1–2 perguntas por vez quando faltar contexto. Responda em markdown "
    "enxuto (títulos e listas curtas). Quando propuser conteúdo para o brief, deixe-o "
    "pronto para o usuário copiar."
)


async def listar_chat(session: AsyncSession, projeto_id: uuid.UUID) -> list[IdeiaChat]:
    res = await session.execute(
        select(IdeiaChat).where(IdeiaChat.projeto_id == projeto_id).order_by(IdeiaChat.criado_em.asc())
    )
    return list(res.scalars().all())


async def limpar_chat(session: AsyncSession, projeto_id: uuid.UUID) -> None:
    await session.execute(delete(IdeiaChat).where(IdeiaChat.projeto_id == projeto_id))
    await session.commit()


async def adicionar(session: AsyncSession, projeto_id: uuid.UUID, role: str, content: str) -> IdeiaChat:
    msg = IdeiaChat(projeto_id=projeto_id, role=role, content=content)
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def salvar_brief(session: AsyncSession, projeto: Projeto, brief: str) -> Projeto:
    projeto.brief = brief or None
    await session.commit()
    await session.refresh(projeto)
    return projeto


_NOTAS_MAX_ITEM = 700
_NOTAS_MAX_TOTAL = 8000


async def contexto_notas(session: AsyncSession, excluir_id: uuid.UUID) -> str:
    """Junta brief (ou descrição) de todos os projetos/ideias ativos como contexto."""
    res = await session.execute(
        select(Projeto.nome, Projeto.descricao, Projeto.brief, Projeto.rascunho)
        .where(Projeto.id != excluir_id, Projeto.arquivado.is_(False))
        .order_by(Projeto.criado_em.desc())
    )
    blocos: list[str] = []
    total = 0
    for nome, descricao, brief, rascunho in res.all():
        corpo = (brief or descricao or "").strip()
        if not corpo:
            continue
        bloco = f"### {nome} ({'ideia' if rascunho else 'projeto'})\n{corpo[:_NOTAS_MAX_ITEM]}"
        if total + len(bloco) > _NOTAS_MAX_TOTAL:
            break
        blocos.append(bloco)
        total += len(bloco)
    return "\n\n".join(blocos)


def _contexto(projeto: Projeto) -> str:
    partes = [f"IDEIA: {projeto.nome}"]
    if projeto.descricao:
        partes.append(f"Descrição: {projeto.descricao}")
    if projeto.github_url:
        partes.append(f"GitHub: {projeto.github_url}")
    if projeto.brief:
        partes.append(f"\nBrief atual (o que já foi definido):\n{projeto.brief}")
    return "\n".join(partes)


def _system(projeto: Projeto, notas: str, skills: list[dict]) -> str:
    partes = [_SYSTEM, "", _contexto(projeto)]
    if notas.strip():
        partes.append(
            "\n## Suas anotações (briefs e descrições de outros projetos) — use como contexto "
            "e cite quando relevante:\n" + notas.strip()
        )
    if skills:
        lista = "\n".join(
            f"- {s['name']} — {s.get('display_title') or s['name']}: {s.get('descricao') or '(sem descrição)'}"
            for s in skills
        )
        partes.append(
            "\n## Skills disponíveis do usuário — quando uma delas ajudar na ideia, RECOMENDE-A "
            "pelo `name` e explique como aplicá-la:\n" + lista
        )
    partes.append(
        "\nQuando propuser conteúdo pronto para as anotações, escreva-o como um bloco claro em "
        "markdown — o usuário vai aprovar e salvar no brief desta ideia."
    )
    return "\n".join(partes)


def _render_cli(system: str, mensagens: list[dict]) -> str:
    linhas = [system, ""]
    for m in mensagens:
        papel = "Usuário" if m["role"] == "user" else "Assistente"
        linhas.append(f"{papel}: {m['content']}")
    linhas.append("Assistente:")
    return "\n".join(linhas)


async def assistente_stream(
    projeto: Projeto,
    historico: list[dict],
    nova: str,
    *,
    notas: str = "",
    skills: list[dict] | None = None,
    token: str | None,
    api_key: str,
    model: str,
) -> AsyncIterator[dict]:
    """Emite eventos {type: status|done|error}. `done` traz {'reply': str}."""
    system = _system(projeto, notas, skills or [])
    mensagens = [
        {"role": m["role"], "content": m["content"]}
        for m in historico
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    mensagens.append({"role": "user", "content": nova})

    if token:
        prompt = _render_cli(system, mensagens)
        reply = ""
        async for ev in claude_cli_service.gerar_stream(token, prompt):
            if ev.get("type") == "status":
                yield ev
            elif ev.get("type") == "final":
                reply = (ev.get("texto") or "").strip()
        yield {"type": "done", "data": {"reply": reply}}
        return

    if not api_key:
        raise ValueError("Configure a IA em Configurações (token do Claude Code ou chave da API).")

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    inicio = time.monotonic()
    chars = 0
    ultimo = 0.0
    texto = ""
    yield {"type": "status", "fase": "conectando", "elapsed": 0.0, "chars": 0}
    async with client.messages.stream(
        model=model, max_tokens=4000, system=system, messages=mensagens
    ) as stream:
        async for delta in stream.text_stream:
            texto += delta
            chars += len(delta)
            agora = time.monotonic()
            if agora - ultimo > 0.5:
                ultimo = agora
                yield {"type": "status", "fase": "gerando", "elapsed": round(agora - inicio, 1), "chars": chars}
        final = await stream.get_final_message()
    texto = "".join(b.text for b in final.content if getattr(b, "type", None) == "text").strip() or texto.strip()
    yield {"type": "done", "data": {"reply": texto}}
