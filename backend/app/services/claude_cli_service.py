"""Geração de texto via CLI do Claude Code (assinatura), sem gastar créditos de API.

Usa o token de `claude setup-token` (env CLAUDE_CODE_OAUTH_TOKEN) e roda `claude -p`
em modo headless. Devolve os mesmos formatos de `skill_service.chat`/`melhorar`.
"""
import asyncio
import json
import os

_USAGE_CC = {"input_tokens": 0, "output_tokens": 0, "model": "claude-code"}


async def _run(token: str, prompt: str) -> str:
    env = {
        **os.environ,
        "CLAUDE_CODE_OAUTH_TOKEN": token,
        "HOME": "/tmp",
        "CLAUDE_CONFIG_DIR": "/tmp/claude-cfg",
        "IS_SANDBOX": "1",
    }
    try:
        proc = await asyncio.create_subprocess_exec(
            "claude",
            "-p",
            "--output-format",
            "text",
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
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


async def melhorar(token: str, conteudo: str) -> dict:
    prompt = (
        "Você é especialista em Claude Code Skills. Aprimore o arquivo SKILL.md abaixo: "
        "melhore a clareza da descrição (frontmatter `description`, dizendo QUANDO usar), "
        "organize as instruções e mantenha o frontmatter válido (name e description). "
        "Responda APENAS com o arquivo SKILL.md completo, sem comentários.\n\n" + conteudo
    )
    sugestao = await _run(token, prompt)
    return {"sugestao": sugestao, "usage": dict(_USAGE_CC)}


async def chat(token: str, conteudo: str, mensagens: list[dict]) -> dict:
    conversa = "\n".join(
        f"{'Assistente' if m.get('role') == 'assistant' else 'Usuário'}: {m.get('content', '')}"
        for m in mensagens
        if m.get("content")
    )
    prompt = (
        "Você é um especialista em Claude Code Skills ajudando a melhorar um arquivo SKILL.md. "
        "Responda em português, direto e técnico. "
        "Responda APENAS com um objeto JSON válido no formato:\n"
        '{"reply": "<resposta conversacional>", "sugestao_conteudo": "<SKILL.md completo revisado ou null>"}\n'
        "Use sugestao_conteudo (string com o SKILL.md inteiro) só quando propuser mudança concreta; "
        "caso contrário, null. Mantenha o frontmatter YAML válido.\n\n"
        "SKILL.md atual:\n```\n" + conteudo + "\n```\n\n"
        "Conversa até agora:\n" + conversa
    )
    texto = await _run(token, prompt)

    reply, sugestao = texto, None
    try:
        ini, fim = texto.find("{"), texto.rfind("}")
        if ini != -1 and fim != -1:
            dados = json.loads(texto[ini : fim + 1])
            reply = str(dados.get("reply") or "").strip() or texto
            sug = dados.get("sugestao_conteudo")
            sugestao = sug if isinstance(sug, str) and sug.strip() else None
    except (json.JSONDecodeError, ValueError):
        pass

    return {"reply": reply, "sugestao_conteudo": sugestao, "usage": dict(_USAGE_CC)}
