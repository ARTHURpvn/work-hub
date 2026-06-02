import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.calendario import IntegracaoCalendario, SyncLog
from app.models.tarefa import Tarefa
from app.schemas.calendario import IntegracaoCreate, IntegracaoUpdate
from app.services import crypto_service


def _cifrar(credencial: dict) -> dict:
    """Cifra a credencial inteira (Fernet) e guarda no JSONB como {'enc': token}."""
    return {"enc": crypto_service.encrypt(json.dumps(credencial))}


async def list_integracoes(session: AsyncSession) -> list[IntegracaoCalendario]:
    result = await session.execute(select(IntegracaoCalendario))
    return list(result.scalars().all())


async def get_integracao(session: AsyncSession, integracao_id: uuid.UUID) -> IntegracaoCalendario | None:
    result = await session.execute(
        select(IntegracaoCalendario).where(IntegracaoCalendario.id == integracao_id)
    )
    return result.scalar_one_or_none()


async def create_integracao(session: AsyncSession, data: IntegracaoCreate) -> IntegracaoCalendario:
    integ = IntegracaoCalendario(
        tipo=data.tipo,
        credencial_cifrada=_cifrar(data.credencial),
        ativa=data.ativa,
    )
    session.add(integ)
    await session.flush()
    return integ


async def update_integracao(
    session: AsyncSession, integ: IntegracaoCalendario, data: IntegracaoUpdate
) -> IntegracaoCalendario:
    if data.ativa is not None:
        integ.ativa = data.ativa
    if data.credencial is not None:
        integ.credencial_cifrada = _cifrar(data.credencial)
    await session.flush()
    return integ


async def delete_integracao(session: AsyncSession, integ: IntegracaoCalendario) -> None:
    await session.delete(integ)
    await session.flush()


async def sync_now(session: AsyncSession) -> dict:
    """Dispara a sincronização. BASE (FEAT-07 sem provedor): registra um SYNC_LOG por
    tarefa-com-prazo × integração ativa, marcando que o envio real ainda não está ligado.
    Quando um provedor for implementado, basta substituir o push aqui.
    """
    agora = datetime.now(tz=timezone.utc)

    integracoes = [i for i in await list_integracoes(session) if i.ativa]
    if not integracoes:
        return {"processados": 0, "ok": 0, "erro": 0, "detalhe": "Nenhuma integração ativa."}

    tarefas = list(
        (await session.execute(
            select(Tarefa).where(Tarefa.prazo.is_not(None), Tarefa.status != "Concluido")
        )).scalars().all()
    )

    ok = 0
    erro = 0
    for tarefa in tarefas:
        for integ in integracoes:
            # Sem provedor real ainda → registra como erro informativo.
            session.add(SyncLog(
                tarefa_id=tarefa.id,
                integracao_id=integ.id,
                resultado="erro",
                detalhe=f"Provedor '{integ.tipo}' ainda não envia eventos (FEAT-07 base).",
                criado_em=agora,
            ))
            erro += 1
    await session.flush()

    return {
        "processados": len(tarefas) * len(integracoes),
        "ok": ok,
        "erro": erro,
        "detalhe": "Base sem provedor: o envio real será ligado ao implementar Google/iCloud.",
    }


async def list_sync_logs(session: AsyncSession, limite: int = 20) -> list[SyncLog]:
    result = await session.execute(
        select(SyncLog).order_by(SyncLog.criado_em.desc()).limit(limite)
    )
    return list(result.scalars().all())
