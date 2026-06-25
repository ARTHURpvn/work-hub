import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.ferramenta import (
    CredencialRevelada,
    FerramentaCreate,
    FerramentaResponse,
    FerramentaUpdate,
)
from app.services import ferramenta_service

router = APIRouter()


def _resp(row) -> FerramentaResponse:
    out = FerramentaResponse.model_validate(row)
    out.tem_credencial = bool(row.credencial_cifrada)
    return out


@router.get("", response_model=list[FerramentaResponse])
async def list_ferramentas(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[FerramentaResponse]:
    return [_resp(r) for r in await ferramenta_service.listar(session)]


@router.post("", response_model=FerramentaResponse, status_code=status.HTTP_201_CREATED)
async def create_ferramenta(
    body: FerramentaCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FerramentaResponse:
    if not body.nome.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="nome é obrigatório")
    row = await ferramenta_service.criar(
        session,
        nome=body.nome,
        times=body.times,
        descricao=body.descricao,
        onde_obter=body.onde_obter,
        credencial=body.credencial,
    )
    await session.commit()
    return _resp(row)


@router.put("/{fid}", response_model=FerramentaResponse)
async def update_ferramenta(
    fid: uuid.UUID,
    body: FerramentaUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FerramentaResponse:
    row = await ferramenta_service.obter(session, fid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ferramenta não encontrada")
    row = await ferramenta_service.atualizar(
        session,
        row,
        nome=body.nome,
        times=body.times,
        descricao=body.descricao,
        onde_obter=body.onde_obter,
        credencial=body.credencial,
    )
    await session.commit()
    return _resp(row)


@router.get("/{fid}/revelar", response_model=CredencialRevelada)
async def revelar_credencial(
    fid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CredencialRevelada:
    row = await ferramenta_service.obter(session, fid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ferramenta não encontrada")
    valor = ferramenta_service.revelar(row)
    if valor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sem credencial armazenada")
    return CredencialRevelada(credencial=valor)


@router.delete("/{fid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ferramenta(
    fid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await ferramenta_service.obter(session, fid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ferramenta não encontrada")
    await ferramenta_service.excluir(session, row)
    await session.commit()
