"""Integração com a Anthropic Skill Management API (beta `skills-2025-10-02`).

Opera sobre a chave do Console (workspace). O conteúdo do SKILL.md é mantido no
nosso banco; aqui só subimos/atualizamos/excluímos o bundle remoto e devolvemos
`skill_id`/`version`. As chamadas do SDK (síncronas) rodam em threadpool.
"""
import asyncio
import re
import tempfile
from pathlib import Path

from app.services.skill_service import _parse_frontmatter

BETA = "skills-2025-10-02"
NAME_RE = re.compile(r"^[a-z0-9-]{1,64}$")
RESERVADAS = ("anthropic", "claude")
MAX_BYTES = 30 * 1024 * 1024  # 30 MB


def validar(conteudo: str) -> tuple[str, str]:
    """Valida o SKILL.md localmente (seção 5) e devolve (name, description).

    Levanta ValueError com mensagem clara em qualquer violação.
    """
    if not conteudo or not conteudo.lstrip().startswith("---"):
        raise ValueError("O SKILL.md precisa começar com frontmatter YAML (--- name/description ---).")
    if len(conteudo.encode("utf-8")) >= MAX_BYTES:
        raise ValueError("Bundle acima de 30 MB.")

    name, description = _parse_frontmatter(conteudo)
    if not name:
        raise ValueError("Frontmatter sem `name`.")
    if not NAME_RE.match(name):
        raise ValueError("`name` inválido: use só minúsculas, números e hífens (máx. 64).")
    if any(p in name.lower() for p in RESERVADAS):
        raise ValueError("`name` não pode conter 'anthropic' nem 'claude'.")
    if "<" in name:
        raise ValueError("`name` não pode conter tags XML.")
    if not description or not description.strip():
        raise ValueError("Frontmatter sem `description`.")
    if len(description) > 1024:
        raise ValueError("`description` acima de 1024 caracteres.")
    if "<" in description:
        raise ValueError("`description` não pode conter tags XML.")
    return name, description


def _client(api_key: str):
    if not api_key:
        raise ValueError("Chave da API Anthropic não configurada — defina em Configurações.")
    import anthropic

    return anthropic.Anthropic(api_key=api_key)


def _versao_str(v) -> str:
    return str(getattr(v, "version", v))


def _erro_amigavel(exc: Exception) -> Exception:
    """Mapeia erros 4xx do SDK para ValueError (vira 400 no router)."""
    try:
        import anthropic

        if isinstance(exc, anthropic.APIStatusError) and 400 <= exc.status_code < 500:
            detalhe = getattr(exc, "message", str(exc))
            return ValueError(f"API recusou: {detalhe}")
    except Exception:  # noqa: BLE001
        pass
    return exc


def _bundle_dir(base: str, conteudo: str, arquivos: list[dict] | None = None) -> str:
    """Cria <base>/<name>/ com SKILL.md + arquivos auxiliares; devolve a pasta nomeada.

    A API exige que o nome da pasta do bundle seja igual ao `name` do frontmatter.
    Os auxiliares vão em subcaminhos relativos (ex.: 'reference/srs.md').
    """
    name, _ = _parse_frontmatter(conteudo)
    if not name:
        raise ValueError("Frontmatter sem `name`.")
    pasta = Path(base) / name
    pasta.mkdir(parents=True, exist_ok=True)
    (pasta / "SKILL.md").write_text(conteudo, encoding="utf-8")
    for a in arquivos or []:
        caminho = (a.get("caminho") or "").strip()
        conteudo_aux = a.get("conteudo")
        if not caminho or not isinstance(conteudo_aux, str):
            continue
        alvo = (pasta / caminho).resolve()
        # proteção contra path traversal: o arquivo deve ficar dentro da pasta
        if not str(alvo).startswith(str(pasta.resolve()) + "/"):
            continue
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_text(conteudo_aux, encoding="utf-8")
    return str(pasta)


def _sync_criar(api_key: str, display_title: str, conteudo: str, arquivos: list[dict] | None) -> dict:
    from anthropic.lib import files_from_dir

    client = _client(api_key)
    with tempfile.TemporaryDirectory() as d:
        files = files_from_dir(_bundle_dir(d, conteudo, arquivos))
        try:
            resp = client.beta.skills.create(display_title=display_title, files=files, betas=[BETA])
        except Exception as exc:  # noqa: BLE001
            raise _erro_amigavel(exc)
    return {"skill_id": resp.id, "version": _versao_str(resp.latest_version)}


def _sync_nova_versao(api_key: str, skill_id: str, conteudo: str, arquivos: list[dict] | None) -> str:
    from anthropic.lib import files_from_dir

    client = _client(api_key)
    with tempfile.TemporaryDirectory() as d:
        files = files_from_dir(_bundle_dir(d, conteudo, arquivos))
        try:
            resp = client.beta.skills.versions.create(skill_id=skill_id, files=files, betas=[BETA])
        except Exception as exc:  # noqa: BLE001
            raise _erro_amigavel(exc)
    return _versao_str(resp)


def _sync_excluir(api_key: str, skill_id: str) -> None:
    client = _client(api_key)
    try:
        # 1) deletar todas as versões antes da skill (senão a API retorna 400)
        versoes = list(client.beta.skills.versions.list(skill_id=skill_id, betas=[BETA]))
        for v in versoes:
            client.beta.skills.versions.delete(version=_versao_str(v), skill_id=skill_id, betas=[BETA])
        # 2) deletar a skill
        client.beta.skills.delete(skill_id, betas=[BETA])
    except Exception as exc:  # noqa: BLE001
        raise _erro_amigavel(exc)


async def criar(
    api_key: str, display_title: str, conteudo: str, arquivos: list[dict] | None = None
) -> dict:
    return await asyncio.to_thread(_sync_criar, api_key, display_title, conteudo, arquivos)


async def nova_versao(
    api_key: str, skill_id: str, conteudo: str, arquivos: list[dict] | None = None
) -> str:
    return await asyncio.to_thread(_sync_nova_versao, api_key, skill_id, conteudo, arquivos)


async def excluir_remota(api_key: str, skill_id: str) -> None:
    await asyncio.to_thread(_sync_excluir, api_key, skill_id)
