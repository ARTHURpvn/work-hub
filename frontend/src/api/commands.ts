import { onUnauthorized } from "@/lib/session"

export interface Command {
  id: string
  name: string
  descricao: string | null
  argument_hint: string | null
  model: string | null
  allowed_tools: string | null
  conteudo: string
  atualizado_em: string
}

export interface CommandInput {
  name?: string
  descricao?: string | null
  argument_hint?: string | null
  model?: string | null
  allowed_tools?: string | null
  conteudo: string
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

export const commandsApi = {
  list: () => request<Command[]>("/commands"),
  create: (body: CommandInput) => request<Command>("/commands", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: CommandInput) =>
    request<Command>(`/commands/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/commands/${id}`, { method: "DELETE" }),
}
