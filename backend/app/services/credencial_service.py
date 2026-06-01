import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.credencial import CredencialProjeto
from app.services import crypto_service


async def get_credencial(session: AsyncSession, projeto_id: uuid.UUID) -> CredencialProjeto | None:
    result = await session.execute(
        select(CredencialProjeto).where(CredencialProjeto.projeto_id == projeto_id)
    )
    return result.scalar_one_or_none()


async def upsert_credencial(
    session: AsyncSession, projeto_id: uuid.UUID, usuario: str, senha: str
) -> CredencialProjeto:
    """Cria ou atualiza a credencial do projeto. A senha é cifrada antes de persistir."""
    agora = datetime.now(tz=timezone.utc)
    senha_cifrada = crypto_service.encrypt(senha)

    cred = await get_credencial(session, projeto_id)
    if cred is None:
        cred = CredencialProjeto(
            projeto_id=projeto_id,
            usuario=usuario,
            senha_cifrada=senha_cifrada,
            criado_em=agora,
            atualizado_em=agora,
        )
        session.add(cred)
    else:
        cred.usuario = usuario
        cred.senha_cifrada = senha_cifrada
        cred.atualizado_em = agora

    await session.flush()
    return cred


async def reveal_senha(cred: CredencialProjeto) -> str:
    """Decifra a senha. Use apenas no endpoint explícito de revelar."""
    return crypto_service.decrypt(cred.senha_cifrada)


async def delete_credencial(session: AsyncSession, projeto_id: uuid.UUID) -> bool:
    cred = await get_credencial(session, projeto_id)
    if cred is None:
        return False
    await session.delete(cred)
    await session.flush()
    return True
