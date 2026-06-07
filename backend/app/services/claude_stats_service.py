"""Lê o uso do Claude Code a partir do stats-cache.json (~/.claude).

É um cache que o Claude Code recomputa periodicamente; pode estar levemente
atrasado em relação ao uso de agora.
"""
import json
from pathlib import Path

from app.config import settings


def resumo() -> dict:
    caminho = Path(settings.claude_stats_path)
    vazio = {
        "disponivel": False,
        "atualizado_em": None,
        "sessoes": 0,
        "mensagens": 0,
        "tokens_input": 0,
        "tokens_output": 0,
        "tokens_total": 0,
        "cache_tokens": 0,
        "por_modelo": [],
        "hoje": None,
    }
    if not caminho.is_file():
        return vazio
    try:
        d = json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return vazio

    modelos = d.get("modelUsage") or {}
    por_modelo = []
    tin = tout = tcache = 0
    for nome, u in modelos.items():
        i = int(u.get("inputTokens", 0) or 0)
        o = int(u.get("outputTokens", 0) or 0)
        cache = int(u.get("cacheReadInputTokens", 0) or 0) + int(u.get("cacheCreationInputTokens", 0) or 0)
        tin += i
        tout += o
        tcache += cache
        por_modelo.append({"model": nome, "input": i, "output": o, "cache": cache})
    por_modelo.sort(key=lambda m: m["input"] + m["output"], reverse=True)

    hoje = None
    dmt = d.get("dailyModelTokens")
    if isinstance(dmt, list) and dmt:
        ultimo = dmt[-1]
        tokens = sum(int(v or 0) for v in (ultimo.get("tokensByModel") or {}).values())
        hoje = {"date": ultimo.get("date"), "tokens": tokens}

    return {
        "disponivel": True,
        "atualizado_em": d.get("lastComputedDate"),
        "sessoes": int(d.get("totalSessions", 0) or 0),
        "mensagens": int(d.get("totalMessages", 0) or 0),
        "tokens_input": tin,
        "tokens_output": tout,
        "tokens_total": tin + tout,
        "cache_tokens": tcache,
        "por_modelo": por_modelo,
        "hoje": hoje,
    }
