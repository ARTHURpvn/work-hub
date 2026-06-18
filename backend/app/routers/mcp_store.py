import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.mcp_store import ImportRequest, ImportResult, PackageDoc, SearchResponse
from app.services import mcp_service, mcp_store_service

router = APIRouter()


@router.get("/search", response_model=SearchResponse)
async def search_store(
    q: str = Query("", description="palavra-chave de busca"),
    limit: int = Query(30, ge=1, le=50),
    cursor: str | None = Query(None, description="cursor de paginação"),
    _user: str = Depends(get_current_user),
) -> SearchResponse:
    try:
        return await mcp_store_service.buscar(q, limit, cursor)  # type: ignore[return-value]
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


@router.get("/docs", response_model=PackageDoc)
async def package_docs(
    kind: str = Query(..., description="npm | pypi"),
    id: str = Query(..., description="identificador do pacote"),
    _user: str = Depends(get_current_user),
) -> PackageDoc:
    if kind not in ("npm", "pypi"):
        return PackageDoc()
    return await mcp_store_service.pacote_doc(kind, id)  # type: ignore[return-value]


@router.post("/import", response_model=ImportResult, status_code=status.HTTP_201_CREATED)
async def import_server(
    body: ImportRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ImportResult:
    # fonte da verdade: re-busca a config no registry (não confia no client)
    try:
        norm = await mcp_store_service.detalhar(body.name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))
    if norm is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Server não encontrado no registro.")

    try:
        name_local = mcp_service.validar_name(body.name_local or norm["suggested_name"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if await mcp_service.por_name(session, name_local):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Já existe um MCP '{name_local}'.")

    transport = "http" if norm["url"] else "stdio"
    # env obrigatórios viram pares vazios; secret pela heurística do registry
    env = [{"key": e["name"], "value": "", "secret": bool(e["secret"])}
           for e in norm["env_required"] if e["required"]]
    try:
        row = await mcp_service.criar(
            session,
            name=name_local,
            transport=transport,
            command=norm["command"],
            args=norm["args"] or None,
            url=norm["url"],
            env=env,
            headers=[],
            descricao=norm.get("description"),
        )
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).exception("Falha ao importar MCP %s", body.name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao importar o server. Verifique os logs do servidor.",
        )
    return ImportResult(id=str(row.id), name=row.name)
