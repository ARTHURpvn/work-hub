import { onUnauthorized } from "@/lib/session"

export type CredTipo = "valor" | "email_senha"

export interface Ferramenta {
  id: string
  nome: string
  times: string[]
  descricao: string | null
  site_url: string | null
  onde_obter: string | null
  cred_tipo: CredTipo
  cred_email: string | null
  tem_credencial: boolean
  atualizado_em: string
}

export interface FerramentaInput {
  nome: string
  times: string[]
  descricao?: string | null
  site_url?: string | null
  onde_obter?: string | null
  cred_tipo?: CredTipo
  cred_email?: string | null
  credencial?: string | null
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

export const ferramentasApi = {
  list: () => request<Ferramenta[]>("/ferramentas"),
  create: (body: FerramentaInput) => request<Ferramenta>("/ferramentas", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: FerramentaInput) =>
    request<Ferramenta>(`/ferramentas/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/ferramentas/${id}`, { method: "DELETE" }),
  revelar: (id: string) => request<{ credencial: string }>(`/ferramentas/${id}/revelar`),
}
