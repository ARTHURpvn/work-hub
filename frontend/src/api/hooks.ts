import { onUnauthorized } from "@/lib/session"

export interface Hook {
  id: string
  descricao: string | null
  event: string
  matcher: string | null
  command: string
  timeout: number | null
  atualizado_em: string
}

export interface HookInput {
  descricao?: string | null
  event: string
  matcher?: string | null
  command: string
  timeout?: number | null
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

export const hooksApi = {
  list: () => request<Hook[]>("/hooks"),
  create: (body: HookInput) => request<Hook>("/hooks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: HookInput) =>
    request<Hook>(`/hooks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/hooks/${id}`, { method: "DELETE" }),
}
