"""MCP Store — consulta o registro oficial de MCP (registry.modelcontextprotocol.io).

Só-leitura + normalização. NUNCA executa nada: devolve config normalizada,
comando `claude mcp add` e snippet `.mcp.json` para o usuário copiar/importar.
Cache em memória com TTL curto para não martelar o upstream.
"""
import re
import time

import httpx

BASE_URL = "https://registry.modelcontextprotocol.io"
_TIMEOUT = 10.0
_TTL_S = 300.0  # 5 min

# cache: chave -> (expira_em_monotonic, dados)
_cache: dict[str, tuple[float, list[dict]]] = {}

_RUNTIME = {"npm": "npx", "pypi": "uvx", "oci": "docker"}
_SECRET_RE = re.compile(r"(TOKEN|KEY|SECRET|PASSWORD|PASS|API|CREDENTIAL|AUTH)", re.IGNORECASE)
_SLUG_INVALID = re.compile(r"[^a-z0-9-]+")


def _slug(registry_name: str) -> str:
    """Deriva um name local válido (^[a-z0-9-]{1,64}$) a partir do nome do registry.

    Ex.: 'io.github.upstash/context7' -> 'context7'.
    """
    base = registry_name.rsplit("/", 1)[-1].lower()
    base = _SLUG_INVALID.sub("-", base).strip("-")
    return (base or "mcp")[:64]


def _env_required(pkg: dict) -> list[dict]:
    out: list[dict] = []
    for ev in pkg.get("environmentVariables") or []:
        nome = ev.get("name")
        if not nome:
            continue
        secret = bool(ev.get("isSecret")) or bool(_SECRET_RE.search(nome))
        out.append({
            "name": nome,
            "description": ev.get("description"),
            "required": bool(ev.get("isRequired")),
            "secret": secret,
        })
    return out


def _pkg_args(pkg: dict, identifier: str, kind: str) -> list[str]:
    """Monta os args do comando. Base = identificador; anexa packageArguments com valor/default."""
    args: list[str] = []
    if kind == "npm":
        args = ["-y", identifier]
    elif kind == "pypi":
        args = [identifier]
    elif kind == "oci":
        args = ["run", "-i", "--rm", identifier]
    for pa in pkg.get("packageArguments") or []:
        val = pa.get("value") or pa.get("default")
        if pa.get("type") == "named" and pa.get("name"):
            if val is not None:
                args += [pa["name"], str(val)]
        elif val is not None:
            args.append(str(val))
    return args


def _normalizar(item: dict) -> dict | None:
    s = item.get("server", item) or {}
    name = s.get("name")
    if not name:
        return None
    repo = s.get("repository") or {}
    source_url = repo.get("url")

    transport = "unknown"
    command = None
    args: list[str] = []
    url = None
    package_kind = None
    env_required: list[dict] = []

    pkgs = s.get("packages") or []
    remotes = s.get("remotes") or []
    if pkgs:
        pkg = pkgs[0]
        kind = pkg.get("registryType")
        identifier = pkg.get("identifier") or ""
        package_kind = kind
        command = _RUNTIME.get(kind, kind)
        args = _pkg_args(pkg, identifier, kind)
        transport = (pkg.get("transport") or {}).get("type") or "stdio"
        env_required = _env_required(pkg)
    elif remotes:
        rem = remotes[0]
        transport = rem.get("type") or "http"
        url = rem.get("url")
        package_kind = "remote"

    # normaliza transporte remoto para os aceitos pelo .mcp.json
    if transport in ("streamable-http",):
        transport = "http"

    norm = {
        "name": name,
        "suggested_name": _slug(name),
        "title": s.get("title"),
        "description": s.get("description"),
        "version": s.get("version"),
        "transport": transport,
        "package_kind": package_kind,
        "command": command,
        "args": args,
        "url": url,
        "env_required": env_required,
        "source_url": source_url,
    }
    norm["install_command"] = _montar_install(norm)
    norm["mcp_json"] = _montar_mcp_json(norm)
    return norm


def _montar_install(n: dict) -> str:
    """Comando `claude mcp add` pronto para colar."""
    local = n["suggested_name"]
    env_flags = "".join(f' --env {e["name"]}=<VALOR>' for e in n["env_required"] if e["required"])
    if n["url"]:
        tipo = "sse" if n["transport"] == "sse" else "http"
        return f"claude mcp add --transport {tipo} {local}{env_flags} {n['url']}"
    if n["command"]:
        cmd = " ".join([n["command"], *n["args"]])
        return f"claude mcp add {local}{env_flags} -- {cmd}"
    return f"# server '{n['name']}' sem pacote instalável conhecido"


def _montar_mcp_json(n: dict) -> dict:
    """Bloco mcpServers para colar num .mcp.json."""
    local = n["suggested_name"]
    if n["url"]:
        tipo = "sse" if n["transport"] == "sse" else "http"
        bloco: dict = {"type": tipo, "url": n["url"]}
    elif n["command"]:
        bloco = {"type": "stdio", "command": n["command"], "args": n["args"]}
    else:
        return {"mcpServers": {}}
    if n["env_required"]:
        bloco["env"] = {e["name"]: f"${{{e['name']}}}" for e in n["env_required"] if e["required"]}
        if not bloco["env"]:
            bloco.pop("env")
    return {"mcpServers": {local: bloco}}


async def buscar(q: str, limit: int = 20) -> list[dict]:
    """Busca servers no registro oficial (com cache + timeout). Lança ValueError se upstream falhar."""
    chave = f"{q.strip().lower()}::{limit}"
    agora = time.monotonic()
    cached = _cache.get(chave)
    if cached and cached[0] > agora:
        return cached[1]

    params = {"limit": str(limit)}
    if q.strip():
        params["search"] = q.strip()
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, headers={"User-Agent": "workhub-mcp-store"}) as client:
            resp = await client.get(f"{BASE_URL}/v0/servers", params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise ValueError(f"Falha ao consultar o registro de MCP: {type(exc).__name__}")

    servers = data.get("servers", data if isinstance(data, list) else [])
    # dedup por nome: o registry devolve cada versão como item separado; mantém a 1ª
    # (o registro ordena isLatest primeiro), preservando a ordem de relevância.
    norm: list[dict] = []
    vistos: set[str] = set()
    for it in servers:
        n = _normalizar(it)
        if n and n["name"] not in vistos:
            vistos.add(n["name"])
            norm.append(n)
    _cache[chave] = (agora + _TTL_S, norm)
    return norm


async def detalhar(name: str) -> dict | None:
    """Re-busca um server por nome exato no registry (fonte da verdade para importação)."""
    candidatos = await buscar(name, limit=50)
    exatos = [c for c in candidatos if c["name"] == name]
    if exatos:
        # versão mais recente: o registry já devolve isLatest primeiro; pega o 1º exato
        return exatos[0]
    return None
