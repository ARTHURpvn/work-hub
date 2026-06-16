"""CRUD dos arquivos auxiliares de uma skill multi-arquivo (tabela skill_arquivo).

A cada save a lista de arquivos é substituída por completo (full replace), pois o
frontend/IA sempre envia o conjunto atual de auxiliares.
"""
import re
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_arquivo import SkillArquivo

# caminho relativo seguro: sem barra inicial, sem '..', segmentos simples
_CAMINHO_RE = re.compile(r"^(?!/)(?!.*\.\.)[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*$")


def caminho_valido(caminho: str) -> bool:
    """Aceita só caminhos relativos seguros e nunca o próprio SKILL.md (vai em skill_remota)."""
    c = (caminho or "").strip()
    if not c or len(c) > 255 or not _CAMINHO_RE.match(c):
        return False
    return c.lower() != "skill.md"


def normalizar(arquivos: list[dict] | None) -> list[dict]:
    """Filtra/normaliza a lista vinda do request ou da IA: {caminho, conteudo} válidos e únicos."""
    saida: dict[str, str] = {}
    for a in arquivos or []:
        if not isinstance(a, dict):
            continue
        caminho = str(a.get("caminho") or "").strip()
        conteudo = a.get("conteudo")
        if not caminho_valido(caminho) or not isinstance(conteudo, str):
            continue
        saida[caminho] = conteudo  # dedup por caminho (último vence)
    return [{"caminho": k, "conteudo": v} for k, v in saida.items()]


async def listar(session: AsyncSession, skill_remota_id: uuid.UUID) -> list[SkillArquivo]:
    result = await session.execute(
        select(SkillArquivo)
        .where(SkillArquivo.skill_remota_id == skill_remota_id)
        .order_by(SkillArquivo.caminho)
    )
    return list(result.scalars())


async def substituir(
    session: AsyncSession, skill_remota_id: uuid.UUID, arquivos: list[dict]
) -> None:
    """Apaga os auxiliares atuais e grava o conjunto novo (já normalizado)."""
    await session.execute(
        delete(SkillArquivo).where(SkillArquivo.skill_remota_id == skill_remota_id)
    )
    for a in arquivos:
        session.add(
            SkillArquivo(
                skill_remota_id=skill_remota_id,
                caminho=a["caminho"],
                conteudo=a["conteudo"],
            )
        )
    await session.commit()
