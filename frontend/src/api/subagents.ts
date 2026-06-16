import { onUnauthorized } from "@/lib/session"

export interface Subagent {
  id: string
  name: string
  description: string
  model: string
  tools: string | null
  system_prompt: string
  color: string | null
  atualizado_em: string
}

export interface SubagentInput {
  name?: string
  description: string
  model: string
  tools: string | null
  system_prompt: string
  color?: string | null
}

export interface SubagentMelhoria {
  description: string | null
  system_prompt: string | null
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

export const subagentsApi = {
  list: () => request<Subagent[]>("/subagents"),
  create: (body: SubagentInput) => request<Subagent>("/subagents", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: SubagentInput) =>
    request<Subagent>(`/subagents/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/subagents/${id}`, { method: "DELETE" }),
  melhorar: (id: string) => request<SubagentMelhoria>(`/subagents/${id}/melhorar`, { method: "POST" }),
}
