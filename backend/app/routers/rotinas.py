import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.rotina import RotinaCreate, RotinaResponse, RotinaUpdate
from app.services import rotina_service

router = APIRouter()


@router.get("", response_model=list[RotinaResponse])
async def list_rotinas(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[RotinaResponse]:
    rotinas = await rotina_service.listar(session)
    return [RotinaResponse.model_validate(r) for r in rotinas]


@router.post("", response_model=RotinaResponse, status_code=status.HTTP_201_CREATED)
async def create_rotina(
    body: RotinaCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RotinaResponse:
    nome = body.nome.strip()
    if not nome:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome obrigatório")
    rotina = await rotina_service.criar(session, body.model_dump())
    return RotinaResponse.model_validate(rotina)


@router.patch("/{rotina_id}", response_model=RotinaResponse)
async def update_rotina(
    rotina_id: uuid.UUID,
    body: RotinaUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> RotinaResponse:
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    rotina = await rotina_service.atualizar(session, rotina_id, data)
    if rotina is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rotina não encontrada")
    return RotinaResponse.model_validate(rotina)


@router.delete("/{rotina_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rotina(
    rotina_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    if not await rotina_service.excluir(session, rotina_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rotina não encontrada")
