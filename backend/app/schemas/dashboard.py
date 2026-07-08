from datetime import datetime

from pydantic import BaseModel

from app.schemas.vps import VpsComProjetos


class ProjetosResumo(BaseModel):
    total: int
    ativos: int
    arquivados: int
    ideias: int = 0
    com_vps: int
    com_autenticacao: int
    publicaveis: int
    por_origem: dict[str, int]


class TarefasResumo(BaseModel):
    total: int
    por_status: dict[str, int]
    vencidas: int          # prazo no passado e não concluídas
    proximas_7_dias: int   # prazo nos próximos 7 dias e não concluídas


class AgentesResumo(BaseModel):
    total: int
    por_status: dict[str, int]


class JobsResumo(BaseModel):
    total: int
    por_status: dict[str, int]


class TarefaAtencao(BaseModel):
    id: str
    titulo: str
    prazo: datetime | None
    prioridade: str
    status: str
    projeto_nome: str | None
    vencida: bool


class ProjetoProgresso(BaseModel):
    id: str
    nome: str
    origem: str
    total: int
    concluidas: int


class DashboardSummary(BaseModel):
    projetos: ProjetosResumo
    tarefas: TarefasResumo
    agentes: AgentesResumo
    jobs: JobsResumo
    tarefas_atencao: list[TarefaAtencao]
    projetos_progresso: list[ProjetoProgresso]
    repositorios_por_vps: list[VpsComProjetos]
    projetos_sem_vps: list[dict]  # {id, nome, origem, github_url, site_url}
