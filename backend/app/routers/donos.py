import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.dono import DonoCreate, DonoResponse
from app.services import dono_service

router = APIRouter()


@router.get("", response_model=list[DonoResponse])
async def list_donos(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[DonoResponse]:
    return [DonoResponse(**d) for d in await dono_service.listar(session)]


@router.post("", response_model=DonoResponse, status_code=status.HTTP_201_CREATED)
async def create_dono(
    body: DonoCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DonoResponse:
    try:
        dono = await dono_service.criar(session, body.nome)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    await session.commit()
    return DonoResponse(id=dono.id, nome=dono.nome, criado_em=dono.criado_em, projetos_count=0, vps_count=0)


@router.delete("/{dono_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dono(
    dono_id: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    try:
        removed = await dono_service.excluir(session, dono_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dono não encontrado")
    await session.commit()
