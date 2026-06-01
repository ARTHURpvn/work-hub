from datetime import datetime, timedelta, timezone

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agente import Agente, Job
from app.models.projeto import Projeto
from app.models.tarefa import Tarefa
from app.schemas.dashboard import (
    AgentesResumo,
    DashboardSummary,
    JobsResumo,
    ProjetosResumo,
    TarefasResumo,
)
from app.schemas.vps import ProjetoResumo, VpsComProjetos
from app.services import vps_service

STATUS_CONCLUIDO = "Concluido"


async def _count_by(session: AsyncSession, column: ColumnElement) -> dict[str, int]:
    rows = (await session.execute(select(column, func.count()).group_by(column))).all()
    return {str(k): int(v) for k, v in rows}


async def _count_where(session: AsyncSession, model, *conditions) -> int:
    query = select(func.count()).select_from(model)
    for cond in conditions:
        query = query.where(cond)
    return int(await session.scalar(query) or 0)


async def build_summary(session: AsyncSession) -> DashboardSummary:
    agora = datetime.now(tz=timezone.utc)
    em_7_dias = agora + timedelta(days=7)

    # --- Projetos ---
    por_origem = await _count_by(session, Projeto.origem)
    total_proj = sum(por_origem.values())
    arquivados = await _count_where(session, Projeto, Projeto.arquivado.is_(True))
    projetos = ProjetosResumo(
        total=total_proj,
        ativos=total_proj - arquivados,
        arquivados=arquivados,
        com_vps=await _count_where(session, Projeto, Projeto.vps_id.is_not(None)),
        com_autenticacao=await _count_where(session, Projeto, Projeto.tem_autenticacao.is_(True)),
        publicaveis=await _count_where(
            session, Projeto, Projeto.publicavel.is_(True), Projeto.arquivado.is_(False)
        ),
        por_origem=por_origem,
    )

    # --- Tarefas ---
    por_status_tarefa = await _count_by(session, Tarefa.status)
    tarefas = TarefasResumo(
        total=sum(por_status_tarefa.values()),
        por_status=por_status_tarefa,
        vencidas=await _count_where(
            session,
            Tarefa,
            Tarefa.prazo.is_not(None),
            Tarefa.prazo < agora,
            Tarefa.status != STATUS_CONCLUIDO,
        ),
        proximas_7_dias=await _count_where(
            session,
            Tarefa,
            Tarefa.prazo.is_not(None),
            Tarefa.prazo >= agora,
            Tarefa.prazo <= em_7_dias,
            Tarefa.status != STATUS_CONCLUIDO,
        ),
    )

    # --- Agentes e Jobs ---
    por_status_agente = await _count_by(session, Agente.status)
    agentes = AgentesResumo(total=sum(por_status_agente.values()), por_status=por_status_agente)

    por_status_job = await _count_by(session, Job.status)
    jobs = JobsResumo(total=sum(por_status_job.values()), por_status=por_status_job)

    # --- Repositórios por VPS (apenas projetos não arquivados) ---
    vps_list = await vps_service.list_vps(session)
    repositorios_por_vps = [
        VpsComProjetos(
            id=v.id,
            nome=v.nome,
            ip=v.ip,
            provedor=v.provedor,
            criado_em=v.criado_em,
            projetos=[
                ProjetoResumo.model_validate(p) for p in v.projetos if not p.arquivado
            ],
        )
        for v in vps_list
    ]

    # Projetos ativos sem VPS vinculada
    sem_vps_rows = (
        await session.execute(
            select(
                Projeto.id, Projeto.nome, Projeto.origem, Projeto.github_url, Projeto.site_url
            )
            .where(Projeto.vps_id.is_(None), Projeto.arquivado.is_(False))
            .order_by(Projeto.criado_em.desc())
        )
    ).all()
    projetos_sem_vps = [
        {"id": str(r[0]), "nome": r[1], "origem": r[2], "github_url": r[3], "site_url": r[4]}
        for r in sem_vps_rows
    ]

    return DashboardSummary(
        projetos=projetos,
        tarefas=tarefas,
        agentes=agentes,
        jobs=jobs,
        repositorios_por_vps=repositorios_por_vps,
        projetos_sem_vps=projetos_sem_vps,
    )
