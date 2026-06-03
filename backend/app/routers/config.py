from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.config import ConfigItem, ConfigUpdate
from app.services import config_service

router = APIRouter()


@router.get("", response_model=list[ConfigItem])
async def list_config(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConfigItem]:
    itens = await config_service.listar_status(session)
    return [ConfigItem(**i) for i in itens]


@router.put("/{chave}", response_model=list[ConfigItem])
async def set_config(
    chave: str,
    body: ConfigUpdate,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConfigItem]:
    if chave not in config_service.CHAVES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuração desconhecida")
    valor = body.valor.strip()
    if not valor:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valor vazio")
    await config_service.set_valor(session, chave, valor)
    itens = await config_service.listar_status(session)
    return [ConfigItem(**i) for i in itens]


@router.delete("/{chave}", response_model=list[ConfigItem])
async def delete_config(
    chave: str,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[ConfigItem]:
    if chave not in config_service.CHAVES:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuração desconhecida")
    await config_service.excluir(session, chave)
    itens = await config_service.listar_status(session)
    return [ConfigItem(**i) for i in itens]
