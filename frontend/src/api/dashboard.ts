import { onUnauthorized } from "@/lib/session"
import type { VpsComProjetos } from "./vps"

export interface ProjetosResumo {
  total: number
  ativos: number
  arquivados: number
  ideias: number
  com_vps: number
  com_autenticacao: number
  publicaveis: number
  por_origem: Record<string, number>
}

export interface TarefasResumo {
  total: number
  por_status: Record<string, number>
  vencidas: number
  proximas_7_dias: number
}

export interface ContagemResumo {
  total: number
  por_status: Record<string, number>
}

export interface ProjetoSemVps {
  id: string
  nome: string
  origem: string
  github_url: string | null
  site_url: string | null
}

export interface TarefaAtencao {
  id: string
  titulo: string
  prazo: string | null
  prioridade: string
  status: string
  projeto_nome: string | null
  vencida: boolean
}

export interface ProjetoProgresso {
  id: string
  nome: string
  origem: string
  total: number
  concluidas: number
}

export interface DashboardSummary {
  projetos: ProjetosResumo
  tarefas: TarefasResumo
  agentes: ContagemResumo
  jobs: ContagemResumo
  tarefas_atencao: TarefaAtencao[]
  projetos_progresso: ProjetoProgresso[]
  repositorios_por_vps: VpsComProjetos[]
  projetos_sem_vps: ProjetoSemVps[]
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { credentials: "include" })
  if (!res.ok) {
    if (res.status === 401) onUnauthorized()
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail ?? `Erro ${res.status}`)
  }
  return res.json()
}

export const dashboardApi = {
  summary: () => request<DashboardSummary>("/dashboard/summary"),
}
