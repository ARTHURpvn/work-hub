import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.hook import HookCreate, HookResponse, HookUpdate
from app.services import hook_service

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


@router.get("", response_model=list[HookResponse])
async def list_hooks(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[HookResponse]:
    rows = await hook_service.listar(session)
    return [HookResponse.model_validate(r) for r in rows]


@router.post("", response_model=HookResponse, status_code=status.HTTP_201_CREATED)
async def create_hook(
    body: HookCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HookResponse:
    try:
        event = hook_service.validar_event(body.event)
    except ValueError as exc:
        raise _bad(str(exc))
    if not body.command.strip():
        raise _bad("Command é obrigatório.")
    row = await hook_service.criar(
        session,
        descricao=body.descricao,
        event=event,
        matcher=(body.matcher.strip() if body.matcher else None),
        command=body.command,
        timeout=body.timeout,
    )
    return HookResponse.model_validate(row)


@router.get("/{hid}", response_model=HookResponse)
async def get_hook(
    hid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HookResponse:
    row = await hook_service.obter(session, hid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hook não encontrado")
    return HookResponse.model_validate(row)


@router.put("/{hid}", response_model=HookResponse)
async def update_hook(
    hid: uuid.UUID,
    body: HookUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> HookResponse:
    row = await hook_service.obter(session, hid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hook não encontrado")
    if body.event is not None:
        try:
            body.event = hook_service.validar_event(body.event)
        except ValueError as exc:
            raise _bad(str(exc))
    await hook_service.atualizar(
        session,
        row,
        descricao=body.descricao,
        event=body.event,
        matcher=(body.matcher.strip() if body.matcher is not None else None),
        command=body.command,
        timeout=body.timeout,
    )
    return HookResponse.model_validate(row)


@router.delete("/{hid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hook(
    hid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await hook_service.obter(session, hid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hook não encontrado")
    await hook_service.excluir(session, row)
