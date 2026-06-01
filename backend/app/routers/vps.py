import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.vps import VpsComProjetos, VpsCreate, VpsResponse, VpsUpdate
from app.services import vps_service

router = APIRouter()


@router.get("", response_model=list[VpsComProjetos])
async def list_vps(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[VpsComProjetos]:
    vps_list = await vps_service.list_vps(session)
    return [VpsComProjetos.model_validate(v) for v in vps_list]


@router.post("", response_model=VpsResponse, status_code=status.HTTP_201_CREATED)
async def create_vps(
    body: VpsCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsResponse:
    vps = await vps_service.create_vps(session, body)
    await session.commit()
    return VpsResponse.model_validate(vps)


@router.get("/{vps_id}", response_model=VpsComProjetos)
async def get_vps(
    vps_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> VpsComProjetos:
    vps = await vps_service.get_vps(session, vps_id)
    if vps is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="VPS não encontrada")
    return VpsComProjetos.model_validate(vps)


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
    return VpsResponse.model_validate(vps)


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
