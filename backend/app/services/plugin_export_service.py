"""Gera o bundle de um plugin do Claude Code (marketplace local + plugin + skills)
e devolve como .zip. Valida o resultado via `claude plugin validate` (best-effort).

Estrutura gerada (raiz do zip):

    <name>-marketplace/
    ├── .claude-plugin/marketplace.json
    └── plugins/<name>/
        ├── .claude-plugin/plugin.json
        └── skills/<skill>/SKILL.md (+ reference/templates/…)
"""
import io
import json
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")
# nomes de marketplace/plugin reservados pela Anthropic (não podem ser usados)
RESERVADOS = {
    "claude-plugins-official",
    "claude-plugins-community",
    "anthropic-marketplace",
}


def validar_name(name: str) -> str:
    n = (name or "").strip()
    if not NAME_RE.match(n):
        raise ValueError("`name` do plugin: só minúsculas, números e hífens (máx. 64).")
    if any(p in n for p in ("anthropic", "claude")):
        raise ValueError("`name` do plugin não pode conter 'anthropic' nem 'claude'.")
    if n in RESERVADOS:
        raise ValueError(f"`name` '{n}' é reservado pela Anthropic.")
    return n


def _escrever_arquivo(base: Path, caminho: str, conteudo: str) -> None:
    alvo = (base / caminho).resolve()
    if not str(alvo).startswith(str(base.resolve()) + "/"):
        return  # proteção contra path traversal
    alvo.parent.mkdir(parents=True, exist_ok=True)
    alvo.write_text(conteudo, encoding="utf-8")


def _montar_arvore(
    raiz: Path,
    plugin: dict,
    skills: list[dict],
    subagents: list[dict] | None = None,
    mcps: list[dict] | None = None,
) -> Path:
    """Escreve a árvore marketplace→plugin→(skills+agents+.mcp.json) e devolve a pasta do plugin."""
    name = plugin["name"]
    mkt = raiz / f"{name}-marketplace"
    plugin_dir = mkt / "plugins" / name

    # plugin.json (só name é obrigatório; demais campos quando presentes)
    manifest = {
        "name": name,
        "displayName": plugin.get("display_title") or name,
        "author": {"name": plugin.get("author") or "workhub"},
    }
    if plugin.get("descricao"):
        manifest["description"] = plugin["descricao"]
    if plugin.get("version"):
        manifest["version"] = plugin["version"]
    (plugin_dir / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (plugin_dir / ".claude-plugin" / "plugin.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # marketplace.json apontando para o plugin local
    marketplace = {
        "name": f"{name}-marketplace",
        "owner": {"name": "workhub"},
        "plugins": [
            {
                "name": name,
                "source": f"./plugins/{name}",
                "description": plugin.get("descricao") or plugin.get("display_title") or name,
            }
        ],
    }
    (mkt / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (mkt / ".claude-plugin" / "marketplace.json").write_text(
        json.dumps(marketplace, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # skills: skills/<skill>/SKILL.md + auxiliares (frontmatter normalizado p/ YAML válido)
    from app.services import skill_service

    for s in skills:
        skill_base = plugin_dir / "skills" / s["name"]
        skill_base.mkdir(parents=True, exist_ok=True)
        (skill_base / "SKILL.md").write_text(
            skill_service.normalizar_frontmatter(s["conteudo"]), encoding="utf-8"
        )
        for a in s.get("arquivos") or []:
            _escrever_arquivo(skill_base, a["caminho"], a["conteudo"])

    # subagents: agents/<name>.md
    from app.services import subagent_service

    for sa in subagents or []:
        (plugin_dir / "agents").mkdir(parents=True, exist_ok=True)
        md = subagent_service.montar_md(
            sa["name"], sa["description"], sa.get("model"), sa.get("tools"), sa["system_prompt"]
        )
        (plugin_dir / "agents" / f"{sa['name']}.md").write_text(md, encoding="utf-8")

    # MCP servers: .mcp.json na raiz (segredos como placeholder ${KEY}, nunca valor real)
    if mcps:
        mcp_servers = {m["name"]: m["bloco"] for m in mcps if m.get("name") and m.get("bloco")}
        if mcp_servers:
            (plugin_dir / ".mcp.json").write_text(
                json.dumps({"mcpServers": mcp_servers}, ensure_ascii=False, indent=2), encoding="utf-8"
            )

    # README de instalação
    (mkt / "README.md").write_text(
        f"# {plugin.get('display_title') or name}\n\n"
        f"{plugin.get('descricao') or ''}\n\n"
        "## Instalação (Claude Code)\n\n"
        "```\n"
        f"/plugin marketplace add ./{name}-marketplace\n"
        f"/plugin install {name}@{name}-marketplace\n"
        "```\n\n"
        f"As skills ficam disponíveis como `/{name}:<skill>`.\n",
        encoding="utf-8",
    )
    return plugin_dir


def _validar_cli(plugin_dir: Path) -> list[str]:
    """Roda `claude plugin validate --strict`. Best-effort: nunca bloqueia o export."""
    try:
        proc = subprocess.run(
            ["claude", "plugin", "validate", str(plugin_dir), "--strict"],
            capture_output=True,
            text=True,
            timeout=60,
            env={"HOME": "/tmp", "CLAUDE_CONFIG_DIR": "/tmp/claude-cfg", "IS_SANDBOX": "1", "PATH": os.environ.get("PATH", "")},
        )
        if proc.returncode != 0:
            saida = (proc.stdout + "\n" + proc.stderr).strip()[:800]
            return [f"validate retornou {proc.returncode}: {saida}"] if saida else [f"validate retornou {proc.returncode}"]
        return []
    except FileNotFoundError:
        return ["CLI do Claude Code não encontrado — validação pulada."]
    except subprocess.TimeoutExpired:
        return ["validação excedeu o tempo limite — pulada."]
    except Exception as exc:  # noqa: BLE001
        return [f"validação falhou: {exc}"]


def _zipar(raiz: Path) -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(raiz.rglob("*")):
            if f.is_file():
                zf.write(f, f.relative_to(raiz))
    return buf.getvalue()


def montar_zip(
    plugin: dict,
    skills: list[dict],
    subagents: list[dict] | None = None,
    mcps: list[dict] | None = None,
) -> tuple[bytes, list[str]]:
    """Gera o .zip do marketplace+plugin (skills + subagents + .mcp.json). Devolve (bytes, avisos)."""
    validar_name(plugin["name"])
    if not skills and not subagents and not mcps:
        raise ValueError("O plugin precisa de pelo menos uma skill, subagent ou MCP.")
    with tempfile.TemporaryDirectory() as d:
        raiz = Path(d)
        plugin_dir = _montar_arvore(raiz, plugin, skills, subagents, mcps)
        avisos = _validar_cli(plugin_dir)
        return _zipar(raiz), avisos
