import { onUnauthorized } from "@/lib/session"
export type Status = "A Fazer" | "Em Andamento" | "Em Revisao" | "Concluido"
export type Prioridade = "baixa" | "media" | "alta"

export interface Subtarefa {
  id: string
  titulo: string
  concluida: boolean
  ordem: number
}

export interface TarefaLink {
  id: string
  label: string
  url: string
}

export interface Tarefa {
  id: string
  titulo: string
  descricao: string | null
  status: Status
  prioridade: Prioridade
  prazo: string | null
  projeto_id: string | null
  publicavel: boolean
  retornou_de_revisao: boolean
  revisao_retornos: number
  criado_em: string
  atualizado_em: string
  subtarefas: Subtarefa[]
  links: TarefaLink[]
}

export interface TarefaCreate {
  titulo: string
  descricao?: string | null
  prazo?: string | null
  prioridade?: Prioridade
  projeto_id?: string | null
  status?: Status
  publicavel?: boolean
}

export type TarefaUpdate = Partial<Omit<TarefaCreate, "status">>

export interface TarefaListParams {
  status?: Status
  projeto_id?: string
  com_prazo?: boolean
  order_by?: "criado_em" | "prazo" | "prioridade"
  order_dir?: "asc" | "desc"
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    if (res.status === 401) onUnauthorized()
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail ?? `Erro ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const tarefasApi = {
  list: (params?: TarefaListParams) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set("status", params.status)
    if (params?.projeto_id) qs.set("projeto_id", params.projeto_id)
    if (params?.com_prazo !== undefined) qs.set("com_prazo", String(params.com_prazo))
    if (params?.order_by) qs.set("order_by", params.order_by)
    if (params?.order_dir) qs.set("order_dir", params.order_dir)
    const q = qs.toString()
    return request<Tarefa[]>(`/tarefas${q ? `?${q}` : ""}`)
  },
  create: (body: TarefaCreate) =>
    request<Tarefa>("/tarefas", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: TarefaUpdate) =>
    request<Tarefa>(`/tarefas/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updateStatus: (id: string, status: Status) =>
    request<Tarefa>(`/tarefas/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  delete: (id: string) =>
    request<void>(`/tarefas/${id}`, { method: "DELETE" }),

  addSubtarefa: (tarefaId: string, titulo: string) =>
    request<Subtarefa>(`/tarefas/${tarefaId}/subtarefas`, { method: "POST", body: JSON.stringify({ titulo }) }),
  updateSubtarefa: (tarefaId: string, subId: string, data: { titulo?: string; concluida?: boolean }) =>
    request<Subtarefa>(`/tarefas/${tarefaId}/subtarefas/${subId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSubtarefa: (tarefaId: string, subId: string) =>
    request<void>(`/tarefas/${tarefaId}/subtarefas/${subId}`, { method: "DELETE" }),

  addLink: (tarefaId: string, body: { label: string; url: string }) =>
    request<TarefaLink>(`/tarefas/${tarefaId}/links`, { method: "POST", body: JSON.stringify(body) }),
  deleteLink: (tarefaId: string, linkId: string) =>
    request<void>(`/tarefas/${tarefaId}/links/${linkId}`, { method: "DELETE" }),
}
