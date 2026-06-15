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


def espelhar_local(name: str, conteudo: str, arquivos: list[dict] | None = None) -> None:
    """Espelha a skill da API no filesystem local (~/.claude/skills/<name>/).

    Escreve SKILL.md + arquivos auxiliares e REMOVE auxiliares que não existem mais
    (espelho exato — a API é a fonte da verdade). Idempotente.
    """
    if not SLUG_RE.match(name):
        raise ValueError("name inválido para skill local")
    base = _root("pessoal") / name
    base.mkdir(parents=True, exist_ok=True)
    (base / "SKILL.md").write_text(conteudo, encoding="utf-8")

    mantidos = {(base / "SKILL.md").resolve()}
    for a in arquivos or []:
        caminho = (a.get("caminho") or "").strip()
        conteudo_aux = a.get("conteudo")
        if not caminho or not isinstance(conteudo_aux, str):
            continue
        alvo = (base / caminho).resolve()
        if not str(alvo).startswith(str(base.resolve()) + "/"):
            continue  # path traversal
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_text(conteudo_aux, encoding="utf-8")
        mantidos.add(alvo)

    # poda: remove arquivos auxiliares antigos que não vieram desta vez
    for f in base.rglob("*"):
        if f.is_file() and f.resolve() not in mantidos:
            f.unlink()
    # remove diretórios vazios resultantes da poda
    for d in sorted([p for p in base.rglob("*") if p.is_dir()], reverse=True):
        if not any(d.iterdir()):
            d.rmdir()


def remover_local(name: str) -> bool:
    """Remove o espelho local da skill. Best-effort (False se não existir)."""
    if not SLUG_RE.match(name):
        return False
    d = _root("pessoal") / name
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


async def chat(
    conteudo: str,
    mensagens: list[dict],
    api_key: str = "",
    model: str = "",
    arquivos: list[dict] | None = None,
) -> dict:
    """Conversa multi-turno para melhorar a skill (bundle multi-arquivo).

    `mensagens`: lista [{role: "user"|"assistant", content: str}] já trocada.
    `arquivos`: auxiliares atuais da skill (contexto p/ a IA).
    Retorna {reply, sugestao_conteudo, sugestao_arquivos, demonstracao}.
    """
    api_key = api_key or settings.anthropic_api_key
    model = model or settings.anthropic_model
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações")

    from anthropic import AsyncAnthropic

    from app.services import skill_prompt

    client = AsyncAnthropic(api_key=api_key)

    api_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in mensagens
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    if not api_msgs:
        raise ValueError("nenhuma mensagem para enviar")

    msg = await client.messages.create(
        model=model,
        max_tokens=8000,
        system=skill_prompt.system(conteudo, arquivos),
        messages=api_msgs,
    )
    texto = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()

    resultado = _parse_resposta(texto)
    resultado["usage"] = _usage(msg, model)
    return resultado


def _parse_resposta(texto: str) -> dict:
    """Extrai {reply, sugestao_conteudo, sugestao_arquivos, demonstracao} do JSON."""
    import json

    from app.services import skill_arquivo_service

    reply, sugestao, demo, arquivos = texto, None, None, None
    try:
        ini, fim = texto.find("{"), texto.rfind("}")
        if ini != -1 and fim != -1:
            dados = json.loads(texto[ini : fim + 1])
            reply = str(dados.get("reply") or "").strip() or texto
            sug = dados.get("sugestao_conteudo")
            sugestao = sug if isinstance(sug, str) and sug.strip() else None
            dm = dados.get("demonstracao")
            demo = dm if isinstance(dm, str) and dm.strip() else None
            arqs = dados.get("sugestao_arquivos")
            if isinstance(arqs, list):
                arquivos = skill_arquivo_service.normalizar(arqs) or None
    except (json.JSONDecodeError, ValueError):
        pass
    return {
        "reply": reply,
        "sugestao_conteudo": sugestao,
        "sugestao_arquivos": arquivos,
        "demonstracao": demo,
    }


def _usage(msg, model: str) -> dict:
    u = getattr(msg, "usage", None)
    return {
        "input_tokens": getattr(u, "input_tokens", 0) or 0,
        "output_tokens": getattr(u, "output_tokens", 0) or 0,
        "model": model,
    }


async def melhorar(conteudo: str, api_key: str = "", model: str = "") -> dict:
    api_key = api_key or settings.anthropic_api_key
    model = model or settings.anthropic_model
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações")

    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=api_key)
    prompt = (
        "Você é especialista em Claude Code Skills. Aprimore o arquivo SKILL.md abaixo: "
        "melhore a clareza da descrição (frontmatter `description`, que deve dizer claramente "
        "QUANDO usar a skill), organize as instruções do corpo e mantenha o frontmatter válido "
        "(campos name e description). Responda APENAS com o arquivo SKILL.md completo, sem comentários.\n\n"
        f"{conteudo}"
    )
    msg = await client.messages.create(
        model=model,
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    sugestao = "".join(b.text for b in msg.content if getattr(b, "type", None) == "text").strip()
    return {"sugestao": sugestao, "usage": _usage(msg, model)}
