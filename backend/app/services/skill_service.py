"""Gerência de skills do Claude — multi-fonte.

Fontes:
- "pessoal": ~/.claude/skills (montado em /skills) — editável (criar/editar/excluir/melhorar).
- "plugin":  ~/.claude/plugins (montado em /plugins) — somente leitura.
- "desktop": skills do Claude Desktop (montado em /desktop-skills) — somente leitura.

Skills externas (plugin/desktop) podem ser IMPORTADAS para a pasta pessoal,
ficando disponíveis no Claude Code em qualquer lugar.
"""
import shutil
from pathlib import Path

from app.config import settings
from app.schemas.skill import SLUG_RE

# origem -> (diretório raiz, editável, profundo)
# profundo=True usa rglob (skills em subníveis); False espera <root>/<slug>/SKILL.md
FONTES = {
    "pessoal": ("skills_dir", True, False),
    "plugin": ("plugins_dir", False, True),
    "desktop": ("desktop_skills_dir", False, True),
}


def _root(origem: str) -> Path:
    attr = FONTES[origem][0]
    return Path(getattr(settings, attr))


def _editavel(origem: str) -> bool:
    return FONTES[origem][1]


def _parse_frontmatter(texto: str) -> tuple[str | None, str | None]:
    name = description = None
    if texto.startswith("---"):
        fim = texto.find("---", 3)
        if fim != -1:
            for linha in texto[3:fim].splitlines():
                if ":" in linha:
                    chave, valor = linha.split(":", 1)
                    chave = chave.strip()
                    valor = valor.strip().strip("\"'")
                    if chave == "name":
                        name = valor
                    elif chave == "description":
                        description = valor
    return name, description


def _md_paths(origem: str) -> dict[str, Path]:
    """Mapa slug -> diretório da skill, para uma fonte. Dedup por slug."""
    root = _root(origem)
    if not root.is_dir():
        return {}
    _, _, profundo = FONTES[origem]
    indice: dict[str, Path] = {}
    if profundo:
        for md in root.rglob("SKILL.md"):
            slug = md.parent.name
            if SLUG_RE.match(slug) and slug not in indice:
                indice[slug] = md.parent
    else:
        for d in sorted(root.iterdir()):
            if d.is_dir() and (d / "SKILL.md").is_file():
                indice[d.name] = d
    return indice


def listar() -> list[dict]:
    skills: list[dict] = []
    vistos: set[str] = set()
    for origem in FONTES:
        for slug, d in _md_paths(origem).items():
            try:
                texto = (d / "SKILL.md").read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            name, description = _parse_frontmatter(texto)
            chave = f"{origem}:{slug}"
            if chave in vistos:
                continue
            vistos.add(chave)
            skills.append({
                "slug": slug,
                "name": name or slug,
                "description": description,
                "origem": origem,
                "editavel": _editavel(origem),
            })
    return skills


def _skill_dir(origem: str, slug: str) -> Path | None:
    if not SLUG_RE.match(slug):
        return None
    return _md_paths(origem).get(slug)


def obter(origem: str, slug: str) -> dict | None:
    d = _skill_dir(origem, slug)
    if d is None or not (d / "SKILL.md").is_file():
        return None
    texto = (d / "SKILL.md").read_text(encoding="utf-8", errors="ignore")
    name, description = _parse_frontmatter(texto)
    return {
        "slug": slug,
        "name": name or slug,
        "description": description,
        "origem": origem,
        "editavel": _editavel(origem),
        "conteudo": texto,
    }


def _template(name: str, description: str) -> str:
    return f"---\nname: {name}\ndescription: {description}\n---\n\n# {name}\n\nDescreva aqui o que esta skill faz e quando usá-la.\n"


def criar(slug: str, name: str, description: str) -> dict:
    if not SLUG_RE.match(slug):
        raise ValueError("slug inválido")
    d = _root("pessoal") / slug
    if (d / "SKILL.md").exists():
        raise ValueError("já existe uma skill com esse nome")
    d.mkdir(parents=True, exist_ok=True)
    (d / "SKILL.md").write_text(_template(name, description), encoding="utf-8")
    return obter("pessoal", slug)  # type: ignore[return-value]


def salvar(slug: str, conteudo: str) -> dict:
    if not SLUG_RE.match(slug):
        raise ValueError("slug inválido")
    d = _root("pessoal") / slug
    if not (d / "SKILL.md").is_file():
        raise ValueError("skill não encontrada")
    (d / "SKILL.md").write_text(conteudo, encoding="utf-8")
    return obter("pessoal", slug)  # type: ignore[return-value]


def excluir(slug: str) -> bool:
    if not SLUG_RE.match(slug):
        return False
    d = _root("pessoal") / slug
    if not d.is_dir():
        return False
    shutil.rmtree(d)
    return True


def importar(origem: str, slug: str) -> dict:
    """Copia a skill (plugin/desktop) para a pasta pessoal (~/.claude/skills)."""
    if origem == "pessoal":
        raise ValueError("skill já é pessoal")
    src = _skill_dir(origem, slug)
    if src is None:
        raise ValueError("skill de origem não encontrada")
    dst = _root("pessoal") / slug
    if dst.exists():
        raise ValueError("já existe uma skill pessoal com esse nome")
    shutil.copytree(src, dst)
    return obter("pessoal", slug)  # type: ignore[return-value]


async def chat(conteudo: str, mensagens: list[dict]) -> dict:
    """Conversa multi-turno para melhorar a skill.

    `mensagens`: lista [{role: "user"|"assistant", content: str}] já trocada.
    Retorna {"reply": str, "sugestao_conteudo": str | None}: a resposta do
    assistente e, quando ele propõe uma mudança, o SKILL.md completo revisado.
    """
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY não configurada no .env")

    import json

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    system = (
        "Você é um especialista em Claude Code Skills ajudando a melhorar um arquivo SKILL.md. "
        "Converse em português do Brasil, de forma direta e técnica. "
        "Sempre responda APENAS com um objeto JSON válido, sem texto fora dele, no formato:\n"
        '{"reply": "<sua resposta conversacional>", "sugestao_conteudo": "<SKILL.md completo revisado ou null>"}\n'
        "Use sugestao_conteudo (string com o SKILL.md inteiro, frontmatter incluso) somente quando "
        "estiver propondo uma alteração concreta no arquivo; caso contrário, use null. "
        "Mantenha o frontmatter YAML válido (name e description).\n\n"
        "SKILL.md atual:\n"
        "```\n" + conteudo + "\n```"
    )

    api_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in mensagens
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    if not api_msgs:
        raise ValueError("nenhuma mensagem para enviar")

    msg = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=4000,
        system=system,
        messages=api_msgs,
    )
    texto = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()

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

    return {"reply": reply, "sugestao_conteudo": sugestao}


async def melhorar(conteudo: str) -> str:
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY não configurada no .env")

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    prompt = (
        "Você é especialista em Claude Code Skills. Aprimore o arquivo SKILL.md abaixo: "
        "melhore a clareza da descrição (frontmatter `description`, que deve dizer claramente "
        "QUANDO usar a skill), organize as instruções do corpo e mantenha o frontmatter válido "
        "(campos name e description). Responda APENAS com o arquivo SKILL.md completo, sem comentários.\n\n"
        f"{conteudo}"
    )
    msg = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()
