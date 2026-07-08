"""Busca contexto de um repositório GitHub (metadados + README) para gerar descrição.

Só-leitura via httpx. Erros amigáveis viram ValueError (o router converte em 400).
"""
import re

import httpx

_RE = re.compile(r"github\.com[/:]([^/]+)/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$", re.IGNORECASE)
_TIMEOUT = 10.0
_README_MAX = 6000


def parse_owner_repo(url: str) -> tuple[str, str]:
    m = _RE.search((url or "").strip())
    if not m:
        raise ValueError("URL de GitHub inválida")
    return m.group(1), m.group(2)


async def buscar_contexto(url: str, github_token: str | None = None) -> str:
    """Devolve um bloco de texto (nome, descrição, tópicos, linguagem, README) do repo."""
    owner, repo = parse_owner_repo(url)
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "workhub"}
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, headers=headers) as client:
            meta_resp = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
            if meta_resp.status_code == 404:
                raise ValueError("Repositório não encontrado ou privado")
            if meta_resp.status_code in (403, 429):
                raise ValueError("Limite de requisições do GitHub atingido, tente mais tarde")
            meta_resp.raise_for_status()
            meta = meta_resp.json()

            readme = ""
            try:
                r = await client.get(
                    f"https://api.github.com/repos/{owner}/{repo}/readme",
                    headers={**headers, "Accept": "application/vnd.github.raw"},
                )
                if r.status_code == 200:
                    readme = r.text
            except httpx.HTTPError:
                readme = ""
            if not readme:
                # fallback: raw da branch default
                try:
                    r = await client.get(
                        f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/README.md"
                    )
                    if r.status_code == 200:
                        readme = r.text
                except httpx.HTTPError:
                    readme = ""
    except httpx.TimeoutException:
        raise ValueError("O GitHub demorou a responder")
    except httpx.HTTPStatusError as exc:
        raise ValueError(f"GitHub respondeu com erro {exc.response.status_code}")
    except httpx.HTTPError:
        raise ValueError("Não foi possível conectar ao GitHub")

    partes = [f"# {meta.get('name') or repo}"]
    if meta.get("description"):
        partes.append(str(meta["description"]))
    topics = meta.get("topics") or []
    if topics:
        partes.append("tópicos: " + ", ".join(topics))
    if meta.get("language"):
        partes.append("linguagem: " + str(meta["language"]))
    if readme.strip():
        partes.append("\nREADME:\n" + readme.strip()[:_README_MAX])
    return "\n".join(partes)
