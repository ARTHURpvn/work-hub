"""Histórico do chat de melhoria de skills (tabela skill_chat)."""
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill_chat import SkillChat


async def listar(session: AsyncSession, skill_remota_id: uuid.UUID) -> list[SkillChat]:
    result = await session.execute(
        select(SkillChat).where(SkillChat.skill_remota_id == skill_remota_id).order_by(SkillChat.criado_em)
    )
    return list(result.scalars())


async def salvar(
    session: AsyncSession,
    skill_remota_id: uuid.UUID,
    role: str,
    content: str,
    sugestao_conteudo: str | None = None,
    demonstracao: str | None = None,
    sugestao_arquivos: list | None = None,
) -> SkillChat:
    msg = SkillChat(
        skill_remota_id=skill_remota_id,
        role=role,
        content=content,
        sugestao_conteudo=sugestao_conteudo,
        sugestao_arquivos=sugestao_arquivos,
        demonstracao=demonstracao,
    )
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def limpar(session: AsyncSession, skill_remota_id: uuid.UUID) -> None:
    await session.execute(delete(SkillChat).where(SkillChat.skill_remota_id == skill_remota_id))
    await session.commit()
