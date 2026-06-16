"""Geração de texto via CLI do Claude Code (assinatura), sem gastar créditos de API.

Usa o token de `claude setup-token` (env CLAUDE_CODE_OAUTH_TOKEN) e roda `claude -p`
em modo headless. Devolve os mesmos formatos de `skill_service.chat`/`melhorar`.
"""
import asyncio
import json
import os
import time
from typing import AsyncIterator

_USAGE_CC = {"input_tokens": 0, "output_tokens": 0, "model": "claude-code"}

# Sem atividade (nenhuma linha nova) por este tempo => aborta. Substitui o corte
# fixo: gerações longas mas ativas continuam; só travamentos reais são mortos.
_INATIVIDADE_S = 300


def _env(token: str) -> dict:
    """Env mínimo para o subprocess `claude`.

    Não herda `**os.environ`: o CLI roda em modo headless executando prompt
    influenciado pelo usuário, então segredos do app (ENCRYPTION_KEY,
    APP_SECRET_KEY, ADMIN_PASSWORD_HASH, DATABASE_URL, ...) NUNCA devem entrar
    no ambiente dele. Passamos só o necessário para localizar/rodar o binário.
    """
    base = {
        "PATH": os.environ.get("PATH", "/usr/local/bin:/usr/bin:/bin"),
        "CLAUDE_CODE_OAUTH_TOKEN": token,
        "HOME": "/tmp",
        "CLAUDE_CONFIG_DIR": "/tmp/claude-cfg",
        "IS_SANDBOX": "1",
    }
    # Preserva apenas locale/encoding, sem vazar segredos.
    for chave in ("LANG", "LC_ALL", "LC_CTYPE", "TZ"):
        valor = os.environ.get(chave)
        if valor:
            base[chave] = valor
    return base


async def _run(token: str, prompt: str) -> str:
    try:
        proc = await asyncio.create_subprocess_exec(
            "claude",
            "-p",
            "--output-format",
            "text",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=_env(token),
        )
    except FileNotFoundError:
        raise ValueError("CLI do Claude Code não encontrado na imagem.")

    try:
        out, err = await asyncio.wait_for(proc.communicate(prompt.encode("utf-8")), timeout=180)
    except asyncio.TimeoutError:
        proc.kill()
        raise ValueError("Claude Code excedeu o tempo limite.")

    if proc.returncode != 0:
        msg = (err.decode("utf-8", "ignore").strip() or out.decode("utf-8", "ignore").strip())[:300]
        raise ValueError(f"Claude Code falhou: {msg or 'verifique o token (claude setup-token)'}")
    return out.decode("utf-8", "ignore").strip()


async def gerar(token: str, prompt: str) -> str:
    """Gera texto puro pela assinatura (uso genérico).

    Usa o runner em streaming (timeout por inatividade) para não estourar em
    gerações longas, como o refactor multi-arquivo.
    """
    texto = ""
    async for ev in gerar_stream(token, prompt):
        if ev["type"] == "final":
            texto = ev["texto"]
    return texto


async def gerar_stream(token: str, prompt: str) -> AsyncIterator[dict]:
    """Roda o CLI em modo stream-json e emite progresso em tempo real.

    Yields:
        {"type": "status", "fase": str, "elapsed": float, "chars": int}
        {"type": "final", "texto": str}

    O timeout é por INATIVIDADE: se nenhuma linha nova chegar em _INATIVIDADE_S,
    o processo é morto. Assim, uma geração longa porém ativa não é cortada.
    """
    try:
        proc = await asyncio.create_subprocess_exec(
            "claude",
            "-p",
            "--output-format",
            "stream-json",
            "--include-partial-messages",
            "--verbose",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=_env(token),
            # O evento `result` traz o texto final inteiro numa única linha; sobe
            # o limite do readline (padrão 64 KB) p/ caber várias SKILL.md.
            limit=8 * 1024 * 1024,
        )
    except FileNotFoundError:
        raise ValueError("CLI do Claude Code não encontrado na imagem.")

    assert proc.stdin and proc.stdout and proc.stderr
    proc.stdin.write(prompt.encode("utf-8"))
    await proc.stdin.drain()
    proc.stdin.close()

    inicio = time.monotonic()
    chars = 0
    ultimo_emit = 0.0
    final_texto: str | None = None
    erro_result: str | None = None
    partes: list[str] = []

    yield {"type": "status", "fase": "conectando", "elapsed": 0.0, "chars": 0}

    try:
        while True:
            try:
                linha = await asyncio.wait_for(proc.stdout.readline(), timeout=_INATIVIDADE_S)
            except asyncio.TimeoutError:
                proc.kill()
                raise ValueError("Claude Code ficou sem responder (inatividade).")
            if not linha:
                break

            try:
                ev = json.loads(linha.decode("utf-8", "ignore"))
            except json.JSONDecodeError:
                continue

            tipo = ev.get("type")
            agora = time.monotonic()
            elapsed = round(agora - inicio, 1)

            if tipo == "system":
                yield {"type": "status", "fase": "pensando", "elapsed": elapsed, "chars": chars}
            elif tipo == "stream_event":
                bloco = (ev.get("event") or {}).get("delta") or {}
                texto = bloco.get("text") or ""
                if texto:
                    chars += len(texto)
                    if agora - ultimo_emit > 0.5:
                        ultimo_emit = agora
                        yield {"type": "status", "fase": "gerando", "elapsed": elapsed, "chars": chars}
            elif tipo == "assistant":
                for b in (ev.get("message") or {}).get("content") or []:
                    if isinstance(b, dict) and b.get("type") == "text" and b.get("text"):
                        partes.append(b["text"])
            elif tipo == "result":
                final_texto = ev.get("result") if isinstance(ev.get("result"), str) else None
                if ev.get("is_error") or ev.get("subtype") not in (None, "success"):
                    erro_result = str(ev.get("result") or ev.get("subtype") or "erro") [:400]

        await proc.wait()
        if (proc.returncode and proc.returncode != 0) or erro_result:
            err = erro_result or (await proc.stderr.read()).decode("utf-8", "ignore").strip()[:400]
            raise ValueError(f"Claude Code falhou: {err or 'verifique o token (claude setup-token)'}")
    finally:
        if proc.returncode is None:
            proc.kill()

    texto = (final_texto if final_texto is not None else "".join(partes)).strip()
    if not texto:
        raise ValueError("Claude Code não retornou conteúdo.")
    yield {"type": "final", "texto": texto}


async def melhorar(token: str, conteudo: str) -> dict:
    prompt = (
        "Você é especialista em Claude Code Skills. Aprimore o arquivo SKILL.md abaixo: "
        "melhore a clareza da descrição (frontmatter `description`, dizendo QUANDO usar), "
        "organize as instruções e mantenha o frontmatter válido (name e description). "
        "Responda APENAS com o arquivo SKILL.md completo, sem comentários.\n\n" + conteudo
    )
    sugestao = await gerar(token, prompt)
    return {"sugestao": sugestao, "usage": dict(_USAGE_CC)}


async def chat(token: str, conteudo: str, mensagens: list[dict], arquivos: list[dict] | None = None) -> dict:
    from app.services import skill_prompt, skill_service

    texto = await gerar(token, skill_prompt.cli_prompt(conteudo, mensagens, arquivos))
    resultado = skill_service._parse_resposta(texto)  # noqa: SLF001
    resultado["usage"] = dict(_USAGE_CC)
    return resultado
