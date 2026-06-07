import { onUnauthorized } from "@/lib/session"
export interface Rotina {
  id: string
  nome: string
  descricao: string | null
  comando: string | null
  agendamento: string | null
  ativa: boolean
  criado_em: string
  atualizado_em: string
}

export interface RotinaCreate {
  nome: string
  descricao?: string | null
  comando?: string | null
  agendamento?: string | null
  ativa?: boolean
}

export type RotinaUpdate = Partial<RotinaCreate>

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

export const rotinasApi = {
  list: () => request<Rotina[]>("/rotinas"),
  create: (body: RotinaCreate) => request<Rotina>("/rotinas", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: RotinaUpdate) =>
    request<Rotina>(`/rotinas/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/rotinas/${id}`, { method: "DELETE" }),
}
