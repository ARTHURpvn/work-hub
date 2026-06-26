import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ferramenta import Ferramenta
from app.services import crypto_service


async def listar(session: AsyncSession) -> list[Ferramenta]:
    rows = await session.execute(select(Ferramenta).order_by(Ferramenta.nome))
    return list(rows.scalars().all())


async def obter(session: AsyncSession, fid: uuid.UUID) -> Ferramenta | None:
    return await session.get(Ferramenta, fid)


_TIPOS = {"valor", "email_senha"}


def _norm_tipo(t: str | None) -> str:
    return t if t in _TIPOS else "valor"


async def criar(
    session: AsyncSession,
    *,
    nome: str,
    times: list[str],
    descricao: str | None,
    site_url: str | None,
    onde_obter: str | None,
    cred_tipo: str,
    cred_email: str | None,
    credencial: str | None,
) -> Ferramenta:
    tipo = _norm_tipo(cred_tipo)
    row = Ferramenta(
        nome=nome.strip(),
        times=[t for t in (times or []) if t],
        descricao=descricao or None,
        site_url=site_url or None,
        onde_obter=onde_obter or None,
        cred_tipo=tipo,
        cred_email=(cred_email or None) if tipo == "email_senha" else None,
        credencial_cifrada=crypto_service.encrypt(credencial) if credencial else None,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return row


async def atualizar(
    session: AsyncSession,
    row: Ferramenta,
    *,
    nome: str | None,
    times: list[str] | None,
    descricao: str | None,
    site_url: str | None,
    onde_obter: str | None,
    cred_tipo: str | None,
    cred_email: str | None,
    credencial: str | None,
) -> Ferramenta:
    if nome is not None:
        row.nome = nome.strip()
    if times is not None:
        row.times = [t for t in times if t]
    if descricao is not None:
        row.descricao = descricao or None
    if site_url is not None:
        row.site_url = site_url or None
    if onde_obter is not None:
        row.onde_obter = onde_obter or None
    if cred_tipo is not None:
        row.cred_tipo = _norm_tipo(cred_tipo)
        if row.cred_tipo == "valor":
            row.cred_email = None
    if cred_email is not None and row.cred_tipo == "email_senha":
        row.cred_email = cred_email or None
    if credencial is not None:
        # "" limpa a credencial; valor novo cifra
        row.credencial_cifrada = crypto_service.encrypt(credencial) if credencial else None
    await session.flush()
    await session.refresh(row)
    return row


async def excluir(session: AsyncSession, row: Ferramenta) -> None:
    await session.delete(row)
    await session.flush()


def revelar(row: Ferramenta) -> str | None:
    """Decifra a credencial. Use apenas no endpoint explícito de revelar."""
    if not row.credencial_cifrada:
        return None
    return crypto_service.decrypt(row.credencial_cifrada)
