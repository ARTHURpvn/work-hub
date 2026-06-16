import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.mcp import McpCreate, McpResponse, McpUpdate
from app.services import mcp_service

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


def _validar_transporte(transport: str, command: str | None, url: str | None) -> None:
    if transport not in mcp_service.TRANSPORTES:
        raise _bad("transport deve ser 'stdio' ou 'http'.")
    if transport == "stdio" and not (command or "").strip():
        raise _bad("transport stdio exige `command`.")
    if transport == "http" and not (url or "").strip():
        raise _bad("transport http exige `url`.")


async def _resposta(session: AsyncSession, row) -> McpResponse:
    out = McpResponse.model_validate(row)
    # mascara segredos (nunca devolve valor de secret)
    out.env = mcp_service.mascarar(row.env)  # type: ignore[assignment]
    out.headers = mcp_service.mascarar(row.headers)  # type: ignore[assignment]
    out.skill_ids = await mcp_service.skill_ids(session, row.id)
    return out


@router.get("", response_model=list[McpResponse])
async def list_mcp(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[McpResponse]:
    rows = await mcp_service.listar(session)
    return [await _resposta(session, r) for r in rows]


@router.post("", response_model=McpResponse, status_code=status.HTTP_201_CREATED)
async def create_mcp(
    body: McpCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> McpResponse:
    try:
        name = mcp_service.validar_name(body.name)
    except ValueError as exc:
        raise _bad(str(exc))
    _validar_transporte(body.transport, body.command, body.url)
    if await mcp_service.por_name(session, name):
        raise _bad(f"Já existe um MCP '{name}'.")
    row = await mcp_service.criar(
        session,
        name=name,
        transport=body.transport,
        command=body.command,
        args=body.args,
        url=body.url,
        env=[p.model_dump() for p in body.env],
        headers=[p.model_dump() for p in body.headers],
        descricao=body.descricao,
    )
    await mcp_service.set_skills(session, row.id, body.skill_ids)
    return await _resposta(session, row)


@router.get("/{mid}", response_model=McpResponse)
async def get_mcp(
    mid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> McpResponse:
    row = await mcp_service.obter(session, mid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MCP não encontrado")
    return await _resposta(session, row)


@router.put("/{mid}", response_model=McpResponse)
async def update_mcp(
    mid: uuid.UUID,
    body: McpUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> McpResponse:
    row = await mcp_service.obter(session, mid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MCP não encontrado")
    transport = body.transport or row.transport
    _validar_transporte(
        transport,
        body.command if body.command is not None else row.command,
        body.url if body.url is not None else row.url,
    )
    await mcp_service.atualizar(
        session,
        row,
        transport=body.transport,
        command=body.command,
        args=body.args,
        url=body.url,
        env=[p.model_dump() for p in body.env] if body.env is not None else None,
        headers=[p.model_dump() for p in body.headers] if body.headers is not None else None,
        descricao=body.descricao,
    )
    if body.skill_ids is not None:
        await mcp_service.set_skills(session, row.id, body.skill_ids)
    return await _resposta(session, row)


@router.delete("/{mid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mcp(
    mid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await mcp_service.obter(session, mid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MCP não encontrado")
    await mcp_service.excluir(session, row)
