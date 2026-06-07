"""Registro e resumo do consumo da API de IA (tokens + custo estimado)."""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rotina import UsoIA

# Preço estimado por 1 milhão de tokens (entrada, saída), em US$.
# Aproximado; ajuste conforme a tabela oficial da Anthropic.
PRECOS: dict[str, tuple[float, float]] = {
    "claude-sonnet-4-5": (3.0, 15.0),
    "claude-opus-4-5": (15.0, 75.0),
    "claude-haiku-4-5": (1.0, 5.0),
}
PRECO_PADRAO: tuple[float, float] = (3.0, 15.0)


def _custo(model: str, input_tokens: int, output_tokens: int) -> float:
    pin, pout = PRECOS.get(model, PRECO_PADRAO)
    return input_tokens / 1_000_000 * pin + output_tokens / 1_000_000 * pout


async def registrar(
    session: AsyncSession, operacao: str, model: str, input_tokens: int, output_tokens: int
) -> None:
    session.add(
        UsoIA(
            operacao=operacao,
            model=model or "desconhecido",
            input_tokens=int(input_tokens or 0),
            output_tokens=int(output_tokens or 0),
        )
    )
    await session.commit()


def _agg(rows: list[UsoIA]) -> dict:
    chamadas = len(rows)
    inp = sum(r.input_tokens for r in rows)
    out = sum(r.output_tokens for r in rows)
    custo = sum(_custo(r.model, r.input_tokens, r.output_tokens) for r in rows)
    return {
        "chamadas": chamadas,
        "input_tokens": inp,
        "output_tokens": out,
        "tokens": inp + out,
        "custo_usd": round(custo, 4),
    }


async def resumo(session: AsyncSession) -> dict:
    result = await session.execute(select(UsoIA))
    rows = list(result.scalars())

    agora = datetime.now(tz=timezone.utc)
    inicio_mes = datetime(agora.year, agora.month, 1, tzinfo=timezone.utc)

    def _no_mes(r: UsoIA) -> bool:
        dt = r.criado_em
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt >= inicio_mes

    rows_mes = [r for r in rows if _no_mes(r)]
    return {"total": _agg(rows), "mes": _agg(rows_mes)}
