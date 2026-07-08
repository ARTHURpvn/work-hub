import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.vps import (
    SenhaRevelada,
    VpsComProjetos,
    VpsCreate,
    VpsProjetosUpdate,
    VpsResponse,
    VpsUpdate,
)
from app.services import vps_service

router = APIRouter()


def _resp(vps) -> VpsResponse:
    out = VpsResponse.model_validate(vps)
    out.tem_senha = bool(vps.senha_cifrada)
    return out


def _com(vps) -> VpsComProjetos:
    out = VpsComProjetos.model_validate(vps)
    out.tem_senha = bool(vps.senha_cifrada)
    return out


@router.get("", response_model=list[VpsComProjetos])
async def list_vps(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[VpsComProjetos]:
    vps_list = await vps_service.list_vps(session)
    return [_com(v) for v in vps_list]


@router.post("", response_model=VpsResponse, status_code=status.HTTP_201_CREATED)
async def create_vps(
    body: VpsCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsResponse:
    vps = await vps_service.create_vps(session, body)
    await session.commit()
    return _resp(vps)


@router.get("/{vps_id}", response_model=VpsComProjetos)
async def get_vps(
    vps_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsComProjetos:
    vps = await vps_service.get_vps(session, vps_id)
    if vps is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    return _com(vps)


@router.patch("/{vps_id}", response_model=VpsResponse)
async def update_vps(
    vps_id: uuid.UUID,
    body: VpsUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsResponse:
    vps = await vps_service.get_vps(session, vps_id)
    if vps is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    vps = await vps_service.update_vps(session, vps, body)
    await session.commit()
    return _resp(vps)


@router.put("/{vps_id}/projetos", response_model=VpsComProjetos)
async def set_vps_projetos(
    vps_id: uuid.UUID,
    body: VpsProjetosUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsComProjetos:
    vps = await vps_service.get_vps(session, vps_id)
    if vps is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    try:
        await vps_service.set_projetos(session, vps_id, body.projeto_ids)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    await session.commit()
    vps = await vps_service.get_vps(session, vps_id)
    return _com(vps)


@router.get("/{vps_id}/revelar-senha", response_model=SenhaRevelada)
async def revelar_senha(
    vps_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SenhaRevelada:
    vps = await vps_service.get_vps(session, vps_id)
    if vps is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    senha = vps_service.revelar_senha(vps)
    if senha is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sem senha armazenada")
    return SenhaRevelada(senha=senha)


@router.delete("/{vps_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vps(
    vps_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    removed = await vps_service.delete_vps(session, vps_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    await session.commit()
