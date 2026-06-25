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


async def criar(
    session: AsyncSession,
    *,
    nome: str,
    times: list[str],
    descricao: str | None,
    onde_obter: str | None,
    credencial: str | None,
) -> Ferramenta:
    row = Ferramenta(
        nome=nome.strip(),
        times=[t for t in (times or []) if t],
        descricao=descricao or None,
        onde_obter=onde_obter or None,
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
    onde_obter: str | None,
    credencial: str | None,
) -> Ferramenta:
    if nome is not None:
        row.nome = nome.strip()
    if times is not None:
        row.times = [t for t in times if t]
    if descricao is not None:
        row.descricao = descricao or None
    if onde_obter is not None:
        row.onde_obter = onde_obter or None
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
