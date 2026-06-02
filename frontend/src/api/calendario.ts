export type TipoCalendario = "google" | "icloud"

export interface Integracao {
  id: string
  tipo: TipoCalendario
  ativa: boolean
  tem_credencial: boolean
}

export interface SyncResultado {
  processados: number
  ok: number
  erro: number
  detalhe: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail ?? `Erro ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const calendarioApi = {
  listIntegracoes: () => request<Integracao[]>("/calendario/integracoes"),
  createIntegracao: (tipo: TipoCalendario, credencial: Record<string, string>) =>
    request<Integracao>("/calendario/integracoes", {
      method: "POST",
      body: JSON.stringify({ tipo, credencial, ativa: true }),
    }),
  setAtiva: (id: string, ativa: boolean) =>
    request<Integracao>(`/calendario/integracoes/${id}`, { method: "PATCH", body: JSON.stringify({ ativa }) }),
  remove: (id: string) =>
    request<void>(`/calendario/integracoes/${id}`, { method: "DELETE" }),
  sync: () => request<SyncResultado>("/calendario/sync", { method: "POST" }),
}
