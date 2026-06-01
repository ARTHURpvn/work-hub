import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.projeto import Projeto, ProjetoMembro
from app.schemas.projeto import MembroCreate, ProjetoCreate, ProjetoUpdate


_LOAD_RELS = (
    selectinload(Projeto.membros),
    selectinload(Projeto.vps),
    selectinload(Projeto.credencial),
)


async def list_projetos(
    session: AsyncSession,
    origem: str | None = None,
    arquivado: bool | None = None,
) -> list[Projeto]:
    query = select(Projeto).options(*_LOAD_RELS).order_by(Projeto.criado_em.desc())
    if origem is not None:
        query = query.where(Projeto.origem == origem)
    if arquivado is not None:
        query = query.where(Projeto.arquivado == arquivado)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get_projeto(session: AsyncSession, projeto_id: uuid.UUID) -> Projeto | None:
    result = await session.execute(
        select(Projeto).options(*_LOAD_RELS).where(Projeto.id == projeto_id)
    )
    return result.scalar_one_or_none()


async def create_projeto(session: AsyncSession, data: ProjetoCreate) -> Projeto:
    from datetime import datetime, timezone

    projeto = Projeto(
        nome=data.nome,
        descricao=data.descricao,
        origem=data.origem,
        tem_autenticacao=data.tem_autenticacao,
        tem_vps=data.tem_vps,
        ssh_ip=data.ssh_ip if data.tem_vps else None,
        vps_id=data.vps_id,
        github_url=data.github_url,
        site_url=data.site_url,
        publicavel=data.publicavel,
        criado_em=datetime.now(tz=timezone.utc),
    )
    session.add(projeto)
    await session.flush()
    await session.refresh(projeto, ["membros", "vps", "credencial"])
    return projeto


async def update_projeto(
    session: AsyncSession, projeto: Projeto, data: ProjetoUpdate
) -> Projeto:
    patch = data.model_dump(exclude_unset=True)

    # Forçar ssh_ip=None se tem_vps for desabilitado
    if patch.get("tem_vps") is False:
        patch["ssh_ip"] = None

    for field, value in patch.items():
        setattr(projeto, field, value)

    await session.flush()
    await session.refresh(projeto, ["membros", "vps", "credencial"])
    return projeto


async def add_membro(
    session: AsyncSession, projeto: Projeto, data: MembroCreate
) -> ProjetoMembro:
    membro = ProjetoMembro(projeto_id=projeto.id, nome=data.nome, contato=data.contato)
    session.add(membro)
    await session.flush()
    return membro


async def remove_membro(
    session: AsyncSession, projeto_id: uuid.UUID, membro_id: uuid.UUID
) -> bool:
    result = await session.execute(
        select(ProjetoMembro).where(
            ProjetoMembro.id == membro_id, ProjetoMembro.projeto_id == projeto_id
        )
    )
    membro = result.scalar_one_or_none()
    if membro is None:
        return False
    await session.delete(membro)
    await session.flush()
    return True
