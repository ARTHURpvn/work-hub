"""Configurações do app (chaves de API) — valores cifrados em repouso (Fernet).

As chaves conhecidas ficam num registro (`CHAVES`). Valores marcados como
secretos nunca são devolvidos em texto: a API só informa se estão configurados
e uma máscara. Valores não-secretos (ex.: nome do modelo) são devolvidos.
"""
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.configuracao import Configuracao
from app.services import crypto_service

# chave -> metadados
CHAVES: dict[str, dict] = {
    "ANTHROPIC_API_KEY": {
        "label": "Chave da API Anthropic",
        "secret": True,
        "placeholder": "sk-ant-...",
        "ajuda": "Usada pelo chat 'Melhorar com IA' das skills. Crie em console.anthropic.com.",
    },
    "ANTHROPIC_MODEL": {
        "label": "Modelo Anthropic",
        "secret": False,
        "placeholder": settings.anthropic_model,
        "ajuda": "Modelo usado nas chamadas de IA.",
    },
}


def _mascara(valor: str) -> str:
    if len(valor) <= 4:
        return "••••"
    return "••••" + valor[-4:]


async def get_valor(session: AsyncSession, chave: str) -> str | None:
    row = await session.get(Configuracao, chave)
    if row is None:
        return None
    try:
        return crypto_service.decrypt(row.valor_cifrado)
    except ValueError:
        return None


async def set_valor(session: AsyncSession, chave: str, valor: str) -> None:
    cifrado = crypto_service.encrypt(valor)
    row = await session.get(Configuracao, chave)
    if row is None:
        session.add(Configuracao(chave=chave, valor_cifrado=cifrado, atualizado_em=datetime.utcnow()))
    else:
        row.valor_cifrado = cifrado
        row.atualizado_em = datetime.utcnow()
    await session.commit()


async def excluir(session: AsyncSession, chave: str) -> bool:
    row = await session.get(Configuracao, chave)
    if row is None:
        return False
    await session.delete(row)
    await session.commit()
    return True


async def listar_status(session: AsyncSession) -> list[dict]:
    result = await session.execute(select(Configuracao))
    salvos = {c.chave: c.valor_cifrado for c in result.scalars()}
    itens: list[dict] = []
    for chave, meta in CHAVES.items():
        valor = None
        if chave in salvos:
            try:
                valor = crypto_service.decrypt(salvos[chave])
            except ValueError:
                valor = None
        configurado = bool(valor)
        itens.append(
            {
                "chave": chave,
                "label": meta["label"],
                "secret": meta["secret"],
                "placeholder": meta.get("placeholder", ""),
                "ajuda": meta.get("ajuda", ""),
                "configurado": configurado,
                # segredo: nunca devolve o valor, só máscara; não-segredo: devolve o valor
                "valor": None if meta["secret"] else valor,
                "mascara": _mascara(valor) if (meta["secret"] and valor) else None,
            }
        )
    return itens


async def get_anthropic(session: AsyncSession) -> tuple[str, str]:
    """(api_key, model) com fallback para o .env quando não configurado no banco."""
    api_key = await get_valor(session, "ANTHROPIC_API_KEY") or settings.anthropic_api_key
    model = await get_valor(session, "ANTHROPIC_MODEL") or settings.anthropic_model
    return api_key, model
