"""Assistente de skills: editar várias e criar em lote por conversa.

Recebe a lista de skills existentes (name/título/descrição) + a conversa e
propõe AÇÕES (criar/editar), cada uma com um SKILL.md completo. Não aplica nada;
o frontend aplica as ações via os endpoints de create/update.
"""
import json
import re
import time
from typing import AsyncIterator

from app.config import settings
from app.services import claude_cli_service


def _system(skills: list[dict]) -> str:
    if skills:
        lista = "\n".join(
            f"- {s['name']} — {s.get('display_title') or s['name']} — {s.get('descricao') or '(sem descrição)'}"
            for s in skills
        )
    else:
        lista = "(nenhuma skill ainda)"
    from app.services.skill_prompt import PRINCIPIOS

    return (
        "Você é um assistente que ajuda a gerenciar VÁRIAS skills do Claude Code de uma vez: "
        "criar em lote, padronizar e ajustar conteúdo. Cada skill é um BUNDLE: SKILL.md + arquivos "
        "auxiliares opcionais. Converse em português, direto e técnico.\n\n" + PRINCIPIOS + "\n"
        "Quando o usuário pedir mudanças, proponha AÇÕES concretas. Responda APENAS com um JSON "
        "válido, sem nada fora dele, no formato:\n"
        '{"reply": "<resumo do que você propõe>", "acoes": ['
        '{"tipo": "criar"|"editar", "name": "<slug>", "display_title": "<título>", '
        '"descricao": "<quando usar>", "conteudo": "<SKILL.md completo e enxuto>", '
        '"arquivos": [{"caminho": "reference/x.md", "conteudo": "<...>"}]}]}\n\n'
        "Regras:\n"
        "- 'criar': skill nova. O `name` deve ser ÚNICO (não pode existir na lista), só minúsculas, "
        "números e hífens (máx. 64), sem 'anthropic' nem 'claude'.\n"
        "- 'editar': skill EXISTENTE. O `name` deve bater EXATAMENTE com um da lista abaixo.\n"
        "- `conteudo` é o SKILL.md COMPLETO e ENXUTO (frontmatter válido + corpo acionável). "
        "Conhecimento pesado vai em `arquivos` (reference/templates/scripts/examples) e é referenciado "
        "no corpo. `arquivos` é a lista COMPLETA de auxiliares da skill (substitui os atuais); use [] "
        "se a skill não precisar de nenhum.\n"
        "- Para criar em lote, devolva várias ações de uma vez.\n"
        "- IMPORTANTE: no MÁXIMO 6 ações por resposta. Se o pedido abranger mais skills, processe as 6 "
        "primeiras, e no `reply` diga quantas FALTAM e que o usuário deve responder 'continuar' para a "
        "próxima leva. Isso evita que a resposta seja truncada.\n"
        "- Se for só conversa/pergunta (sem mudança), use acoes: [].\n\n"
        "Skills existentes (name — título — descrição):\n" + lista
    )


def _render(mensagens: list[dict]) -> str:
    linhas = []
    for m in mensagens:
        if not m.get("content"):
            continue
        autor = "Assistente" if m.get("role") == "assistant" else "Usuário"
        linhas.append(f"{autor}: {m['content']}")
    return "\n".join(linhas)


_REPLY_PADRAO = "Aqui estão as alterações propostas."
_REPLY_FALHA = (
    "Não consegui interpretar a resposta da IA (provavelmente veio incompleta). "
    "Tente pedir em lotes menores — ex.: 'edite as 5 primeiras' e depois 'continuar'."
)


def _objetos_balanceados(texto: str) -> list[str]:
    """Extrai cada objeto JSON `{...}` de nível superior, tolerando truncamento no fim.

    Faz parsing char a char respeitando strings e escapes, então um SKILL.md com
    chaves/aspas no meio não confunde a contagem. Objetos incompletos (corte) são
    simplesmente descartados.
    """
    objs: list[str] = []
    depth = 0
    in_str = False
    esc = False
    start = -1
    for i, c in enumerate(texto):
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            if depth > 0:
                depth -= 1
                if depth == 0 and start != -1:
                    objs.append(texto[start : i + 1])
                    start = -1
    return objs


def _coletar_acoes(itens: list) -> list[dict]:
    from app.services import skill_arquivo_service

    acoes: list[dict] = []
    for a in itens:
        if not isinstance(a, dict):
            continue
        tipo, name, conteudo = a.get("tipo"), a.get("name"), a.get("conteudo")
        if tipo in ("criar", "editar") and name and isinstance(conteudo, str) and conteudo.strip():
            arqs = a.get("arquivos")
            arquivos = skill_arquivo_service.normalizar(arqs) if isinstance(arqs, list) else []
            acoes.append(
                {
                    "tipo": tipo,
                    "name": str(name),
                    "display_title": a.get("display_title") or str(name),
                    "descricao": a.get("descricao"),
                    "conteudo": conteudo,
                    "arquivos": arquivos,
                }
            )
    return acoes


def _extrair_reply(texto: str) -> str:
    m = re.search(r'"reply"\s*:\s*"((?:[^"\\]|\\.)*)"', texto)
    if not m:
        return ""
    try:
        return json.loads('"' + m.group(1) + '"').strip()
    except (json.JSONDecodeError, ValueError):
        return m.group(1).strip()


def _parse(texto: str) -> dict:
    bruto = texto.strip()
    # remove cercas markdown (```json … ```)
    if bruto.startswith("```"):
        bruto = bruto.strip("`")
        if bruto[:4].lower() == "json":
            bruto = bruto[4:]
        bruto = bruto.strip()

    # 1) caminho feliz: JSON íntegro
    ini, fim = bruto.find("{"), bruto.rfind("}")
    if ini != -1 and fim > ini:
        try:
            dados = json.loads(bruto[ini : fim + 1])
            reply = str(dados.get("reply") or "").strip() or _REPLY_PADRAO
            return {"reply": reply, "acoes": _coletar_acoes(dados.get("acoes") or [])}
        except (json.JSONDecodeError, ValueError):
            pass

    # 2) salvamento: JSON truncado/sujo — recupera reply + ações COMPLETAS
    reply = _extrair_reply(bruto) or _REPLY_PADRAO
    inicio = bruto.find('"acoes"')
    trecho = bruto[inicio:] if inicio != -1 else bruto
    objetos = []
    for o in _objetos_balanceados(trecho):
        try:
            objetos.append(json.loads(o))
        except (json.JSONDecodeError, ValueError):
            continue
    acoes = _coletar_acoes(objetos)
    if acoes:
        reply += (
            f"\n\n(Atenção: a resposta veio longa e foi truncada — recuperei {len(acoes)} "
            "ação(ões) completa(s). Se faltou alguma skill, peça em lotes menores ou diga 'continuar'.)"
        )
    else:
        reply = _REPLY_FALHA
    return {"reply": reply, "acoes": acoes}


async def assistente(
    skills: list[dict],
    mensagens: list[dict],
    *,
    api_key: str = "",
    model: str = "",
    token: str | None = None,
) -> dict:
    system = _system(skills)

    if token:
        texto = await claude_cli_service.gerar(token, system + "\n\nConversa:\n" + _render(mensagens))
        return _parse(texto)

    api_key = api_key or settings.anthropic_api_key
    model = model or settings.anthropic_model
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações")

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    api_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in mensagens
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    if not api_msgs:
        raise ValueError("nenhuma mensagem para enviar")
    msg = await client.messages.create(model=model, max_tokens=8000, system=system, messages=api_msgs)
    texto = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()
    return _parse(texto)


async def assistente_stream(
    skills: list[dict],
    mensagens: list[dict],
    *,
    api_key: str = "",
    model: str = "",
    token: str | None = None,
) -> AsyncIterator[dict]:
    """Versão streaming: emite progresso e, no fim, o resultado parseado.

    Yields:
        {"type": "status", "fase": str, "elapsed": float, "chars": int}
        {"type": "done", "data": {"reply": str, "acoes": list}}
    """
    system = _system(skills)

    if token:
        prompt = system + "\n\nConversa:\n" + _render(mensagens)
        texto = ""
        async for ev in claude_cli_service.gerar_stream(token, prompt):
            if ev["type"] == "final":
                texto = ev["texto"]
            else:
                yield ev
        yield {"type": "done", "data": _parse(texto)}
        return

    api_key = api_key or settings.anthropic_api_key
    model = model or settings.anthropic_model
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações")

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    api_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in mensagens
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    if not api_msgs:
        raise ValueError("nenhuma mensagem para enviar")

    inicio = time.monotonic()
    chars = 0
    ultimo_emit = 0.0
    yield {"type": "status", "fase": "conectando", "elapsed": 0.0, "chars": 0}
    async with client.messages.stream(
        model=model, max_tokens=8000, system=system, messages=api_msgs
    ) as stream:
        async for delta in stream.text_stream:
            chars += len(delta)
            agora = time.monotonic()
            if agora - ultimo_emit > 0.5:
                ultimo_emit = agora
                yield {"type": "status", "fase": "gerando", "elapsed": round(agora - inicio, 1), "chars": chars}
        final = await stream.get_final_message()
    texto = "".join(b.text for b in final.content if getattr(b, "type", None) == "text").strip()
    yield {"type": "done", "data": _parse(texto)}
