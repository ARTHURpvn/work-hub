import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.credencial import CredencialResponse, CredencialReveal, CredencialUpsert
from app.schemas.projeto import MembroCreate, MembroResponse, ProjetoCreate, ProjetoResponse, ProjetoUpdate
from app.services import credencial_service, projeto_service

router = APIRouter()


async def _get_projeto_ou_404(session: AsyncSession, projeto_id: uuid.UUID):
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    return projeto


@router.get("", response_model=list[ProjetoResponse])
async def list_projetos(
    origem: str | None = Query(None),
    arquivado: bool | None = Query(None),
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ProjetoResponse]:
    projetos = await projeto_service.list_projetos(session, origem=origem, arquivado=arquivado)
    return [ProjetoResponse.model_validate(p) for p in projetos]


@router.post("", response_model=ProjetoResponse, status_code=status.HTTP_201_CREATED)
async def create_projeto(
    body: ProjetoCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.create_projeto(session, body)
    await session.commit()
    return ProjetoResponse.model_validate(projeto)


@router.get("/{projeto_id}", response_model=ProjetoResponse)
async def get_projeto(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    return ProjetoResponse.model_validate(projeto)


@router.patch("/{projeto_id}", response_model=ProjetoResponse)
async def update_projeto(
    projeto_id: uuid.UUID,
    body: ProjetoUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProjetoResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    projeto = await projeto_service.update_projeto(session, projeto, body)
    await session.commit()
    return ProjetoResponse.model_validate(projeto)


@router.post("/{projeto_id}/membros", response_model=MembroResponse, status_code=status.HTTP_201_CREATED)
async def add_membro(
    projeto_id: uuid.UUID,
    body: MembroCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> MembroResponse:
    projeto = await projeto_service.get_projeto(session, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado")
    membro = await projeto_service.add_membro(session, projeto, body)
    await session.commit()
    return MembroResponse.model_validate(membro)


@router.delete("/{projeto_id}/membros/{membro_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_membro(
    projeto_id: uuid.UUID,
    membro_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await projeto_service.remove_membro(session, projeto_id, membro_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro não encontrado")
    await session.commit()


# --- Credencial de login do site (1 por projeto, senha cifrada) ---


@router.get("/{projeto_id}/credencial", response_model=CredencialResponse)
async def get_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialResponse:
    cred = await credencial_service.get_credencial(session, projeto_id)
    if cred is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    return CredencialResponse(
        projeto_id=cred.projeto_id, usuario=cred.usuario, atualizado_em=cred.atualizado_em
    )


@router.put("/{projeto_id}/credencial", response_model=CredencialResponse)
async def upsert_credencial(
    projeto_id: uuid.UUID,
    body: CredencialUpsert,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialResponse:
    await _get_projeto_ou_404(session, projeto_id)
    cred = await credencial_service.upsert_credencial(session, projeto_id, body.usuario, body.senha)
    await session.commit()
    return CredencialResponse(
        projeto_id=cred.projeto_id, usuario=cred.usuario, atualizado_em=cred.atualizado_em
    )


@router.get("/{projeto_id}/credencial/revelar", response_model=CredencialReveal)
async def revelar_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialReveal:
    cred = await credencial_service.get_credencial(session, projeto_id)
    if cred is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    senha = await credencial_service.reveal_senha(cred)
    return CredencialReveal(usuario=cred.usuario, senha=senha)


@router.delete("/{projeto_id}/credencial", status_code=status.HTTP_204_NO_CONTENT)
async def delete_credencial(
    projeto_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await credencial_service.delete_credencial(session, projeto_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credencial não encontrada")
    await session.commit()
