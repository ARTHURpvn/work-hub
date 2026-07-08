import { onUnauthorized } from "@/lib/session"
export interface ProjetoResumo {
  id: string
  nome: string
  origem: string
  github_url: string | null
  site_url: string | null
}

export interface Vps {
  id: string
  nome: string | null
  ip: string
  provedor: string | null
  criado_em: string
  tem_senha: boolean
}

export interface VpsComProjetos extends Vps {
  projetos: ProjetoResumo[]
}

export interface VpsCreate {
  nome?: string | null
  ip: string
  provedor?: string | null
  senha?: string | null
}

export type VpsUpdate = Partial<VpsCreate>

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

export const vpsApi = {
  list: () => request<VpsComProjetos[]>("/vps"),
  get: (id: string) => request<VpsComProjetos>(`/vps/${id}`),
  create: (body: VpsCreate) =>
    request<Vps>("/vps", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: VpsUpdate) =>
    request<Vps>(`/vps/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  setProjetos: (id: string, projeto_ids: string[]) =>
    request<VpsComProjetos>(`/vps/${id}/projetos`, {
      method: "PUT",
      body: JSON.stringify({ projeto_ids }),
    }),
  revelarSenha: (id: string) => request<{ senha: string }>(`/vps/${id}/revelar-senha`),
  remove: (id: string) => request<void>(`/vps/${id}`, { method: "DELETE" }),
}
