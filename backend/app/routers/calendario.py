import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.calendario import (
    IntegracaoCreate,
    IntegracaoResponse,
    IntegracaoUpdate,
    SyncLogResponse,
    SyncResultado,
)
from app.services import calendario_service

router = APIRouter()


def _to_response(integ) -> IntegracaoResponse:
    return IntegracaoResponse(
        id=integ.id,
        tipo=integ.tipo,
        ativa=integ.ativa,
        tem_credencial=bool(integ.credencial_cifrada),
    )


@router.get("/integracoes", response_model=list[IntegracaoResponse])
async def list_integracoes(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[IntegracaoResponse]:
    integs = await calendario_service.list_integracoes(session)
    return [_to_response(i) for i in integs]


@router.post("/integracoes", response_model=IntegracaoResponse, status_code=status.HTTP_201_CREATED)
async def create_integracao(
    body: IntegracaoCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> IntegracaoResponse:
    integ = await calendario_service.create_integracao(session, body)
    await session.commit()
    return _to_response(integ)


@router.patch("/integracoes/{integracao_id}", response_model=IntegracaoResponse)
async def update_integracao(
    integracao_id: uuid.UUID,
    body: IntegracaoUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> IntegracaoResponse:
    integ = await calendario_service.get_integracao(session, integracao_id)
    if integ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integração não encontrada")
    integ = await calendario_service.update_integracao(session, integ, body)
    await session.commit()
    return _to_response(integ)


@router.delete("/integracoes/{integracao_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integracao(
    integracao_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    integ = await calendario_service.get_integracao(session, integracao_id)
    if integ is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integração não encontrada")
    await calendario_service.delete_integracao(session, integ)
    await session.commit()


@router.post("/sync", response_model=SyncResultado)
async def sync_now(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SyncResultado:
    resultado = await calendario_service.sync_now(session)
    await session.commit()
    return SyncResultado(**resultado)


@router.get("/sync-logs", response_model=list[SyncLogResponse])
async def list_sync_logs(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SyncLogResponse]:
    logs = await calendario_service.list_sync_logs(session)
    return [SyncLogResponse.model_validate(log) for log in logs]
