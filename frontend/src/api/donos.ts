import { onUnauthorized } from "@/lib/session"

export interface Dono {
  id: string
  nome: string
  criado_em: string
  projetos_count: number
  vps_count: number
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

export const donosApi = {
  list: () => request<Dono[]>("/donos"),
  create: (nome: string) => request<Dono>("/donos", { method: "POST", body: JSON.stringify({ nome }) }),
  remove: (id: string) => request<void>(`/donos/${id}`, { method: "DELETE" }),
}
