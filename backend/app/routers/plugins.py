import logging
import uuid
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.plugin import PluginCreate, PluginResponse, PluginUpdate
from app.services import (
    command_service,
    hook_service,
    mcp_service,
    plugin_export_service,
    plugin_service,
    skill_arquivo_service,
    skill_remota_service,
    subagent_service,
)

router = APIRouter()


def _bad(msg: str):
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)


async def _resposta(session: AsyncSession, row) -> PluginResponse:
    out = PluginResponse.model_validate(row)
    out.skill_ids = await plugin_service.skill_ids(session, row.id)
    out.subagent_ids = await plugin_service.subagent_ids(session, row.id)
    out.mcp_ids = await plugin_service.mcp_ids(session, row.id)
    out.hook_ids = await plugin_service.hook_ids(session, row.id)
    out.command_ids = await plugin_service.command_ids(session, row.id)
    return out


@router.get("", response_model=list[PluginResponse])
async def list_plugins(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[PluginResponse]:
    rows = await plugin_service.listar(session)
    return [await _resposta(session, r) for r in rows]


@router.post("", response_model=PluginResponse, status_code=status.HTTP_201_CREATED)
async def create_plugin(
    body: PluginCreate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PluginResponse:
    try:
        name = plugin_export_service.validar_name(body.name)
    except ValueError as exc:
        raise _bad(str(exc))
    if await plugin_service.por_name(session, name):
        raise _bad(f"Já existe um plugin '{name}'.")
    row = await plugin_service.criar(
        session,
        name=name,
        display_title=body.display_title.strip() or name,
        descricao=body.descricao,
        version=body.version.strip() or "0.1.0",
        ids=body.skill_ids,
        sub_ids=body.subagent_ids,
        mcp_ids_=body.mcp_ids,
        hook_ids_=body.hook_ids,
        cmd_ids_=body.command_ids,
    )
    return await _resposta(session, row)


@router.get("/{pid}", response_model=PluginResponse)
async def get_plugin(
    pid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PluginResponse:
    row = await plugin_service.obter(session, pid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin não encontrado")
    return await _resposta(session, row)


@router.put("/{pid}", response_model=PluginResponse)
async def update_plugin(
    pid: uuid.UUID,
    body: PluginUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PluginResponse:
    row = await plugin_service.obter(session, pid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin não encontrado")
    await plugin_service.atualizar(
        session,
        row,
        ids=body.skill_ids,
        sub_ids=body.subagent_ids,
        mcp_ids_=body.mcp_ids,
        hook_ids_=body.hook_ids,
        cmd_ids_=body.command_ids,
        display_title=(body.display_title.strip() if body.display_title else None),
        descricao=body.descricao,
        version=(body.version.strip() if body.version else None),
    )
    return await _resposta(session, row)


@router.delete("/{pid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin(
    pid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    row = await plugin_service.obter(session, pid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin não encontrado")
    await plugin_service.excluir(session, row)


@router.post("/{pid}/export")
async def export_plugin(
    pid: uuid.UUID,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    row = await plugin_service.obter(session, pid)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plugin não encontrado")

    ids = await plugin_service.skill_ids(session, pid)
    skills: list[dict] = []
    for sid in ids:
        s = await skill_remota_service.obter(session, sid)
        if s is None:
            continue
        arquivos = [
            {"caminho": a.caminho, "conteudo": a.conteudo}
            for a in await skill_arquivo_service.listar(session, sid)
        ]
        skills.append({"name": s.name, "conteudo": s.conteudo, "arquivos": arquivos})

    subagents: list[dict] = []
    for said in await plugin_service.subagent_ids(session, pid):
        sa = await subagent_service.obter(session, said)
        if sa is None:
            continue
        subagents.append(
            {
                "name": sa.name,
                "description": sa.description,
                "model": sa.model,
                "tools": sa.tools,
                "system_prompt": sa.system_prompt,
            }
        )

    mcps: list[dict] = []
    for mid in await plugin_service.mcp_ids(session, pid):
        srv = await mcp_service.obter(session, mid)
        if srv is None:
            continue
        mcps.append({"name": srv.name, "bloco": mcp_service.bloco_export(srv)})

    hook_rows = []
    for hid in await plugin_service.hook_ids(session, pid):
        h = await hook_service.obter(session, hid)
        if h is None:
            continue
        hook_rows.append({"event": h.event, "matcher": h.matcher, "command": h.command, "timeout": h.timeout})
    hooks_json = hook_service.montar_hooks_json(hook_rows) if hook_rows else None

    commands: list[dict] = []
    for cid in await plugin_service.command_ids(session, pid):
        c = await command_service.obter(session, cid)
        if c is None:
            continue
        commands.append(
            {
                "name": c.name,
                "descricao": c.descricao,
                "argument_hint": c.argument_hint,
                "model": c.model,
                "allowed_tools": c.allowed_tools,
                "conteudo": c.conteudo,
            }
        )

    plugin = {
        "name": row.name,
        "display_title": row.display_title,
        "descricao": row.descricao,
        "version": row.version,
    }
    try:
        conteudo_zip, avisos = plugin_export_service.montar_zip(plugin, skills, subagents, mcps, hooks_json, commands)
    except ValueError as exc:
        raise _bad(str(exc))
    except Exception:  # noqa: BLE001
        logging.getLogger(__name__).exception("Falha ao gerar plugin %s", row.name)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao gerar o plugin. Verifique os logs do servidor.",
        )

    headers = {
        "Content-Disposition": f'attachment; filename="{row.name}-marketplace.zip"',
        "X-Plugin-Avisos": quote("; ".join(avisos)) if avisos else "",
    }
    return Response(content=conteudo_zip, media_type="application/zip", headers=headers)
