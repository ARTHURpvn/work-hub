import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.command import CommandCreate, CommandResponse, CommandUpdate
from app.services import command_service

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def _espelhar(row) -> None:
    try:
        command_service.espelhar_local(row)
    except Exception as exc:  # noqa: BLE001
        print(f"[commands] falha ao espelhar '{row.name}': {exc}", flush=True)


@router.get("", response_model=list[CommandResponse])
async def list_commands(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[CommandResponse]:
    rows = await command_service.listar(session)
    return [CommandResponse.model_validate(r) for r in rows]


@router.post("", response_model=CommandResponse, status_code=status.HTTP_201_CREATED)
async def create_command(
    body: CommandCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CommandResponse:
    try:
        name = command_service.validar_name(body.name)
    except ValueError as exc:
        raise _bad(str(exc))
    if not body.conteudo.strip():
        raise _bad("Conteúdo (prompt) é obrigatório.")
    if await command_service.por_name(session, name):
        raise _bad(f"Já existe um command '{name}'.")
    row = await command_service.criar(
        session,
        name=name,
        descricao=body.descricao,
        argument_hint=body.argument_hint,
        model=body.model,
        allowed_tools=body.allowed_tools,
        conteudo=body.conteudo,
    )
    _espelhar(row)
    return CommandResponse.model_validate(row)


@router.get("/{cid}", response_model=CommandResponse)
async def get_command(
    cid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CommandResponse:
    row = await command_service.obter(session, cid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command não encontrado")
    return CommandResponse.model_validate(row)


@router.put("/{cid}", response_model=CommandResponse)
async def update_command(
    cid: uuid.UUID,
    body: CommandUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> CommandResponse:
    row = await command_service.obter(session, cid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command não encontrado")
    await command_service.atualizar(
        session,
        row,
        descricao=body.descricao,
        argument_hint=body.argument_hint,
        model=body.model,
        allowed_tools=body.allowed_tools,
        conteudo=body.conteudo,
    )
    _espelhar(row)
    return CommandResponse.model_validate(row)


@router.delete("/{cid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_command(
    cid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await command_service.obter(session, cid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command não encontrado")
    nome = row.name
    await command_service.excluir(session, row)
    try:
        command_service.remover_local(nome)
    except Exception as exc:  # noqa: BLE001
        print(f"[commands] falha ao remover '{nome}': {exc}", flush=True)
