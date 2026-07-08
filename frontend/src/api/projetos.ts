import { onUnauthorized } from "@/lib/session"
// dono dinâmico: origem é texto livre (validado contra a tabela `dono` no back)
export type Origem = string

export interface Membro {
  id: string
  nome: string
  contato: string | null
}

export interface VpsResumo {
  id: string
  nome: string | null
  ip: string
  provedor: string | null
}

export interface Projeto {
  id: string
  nome: string
  descricao: string | null
  origem: Origem
  tem_autenticacao: boolean
  tem_vps: boolean
  ssh_ip: string | null
  vps_id: string | null
  github_url: string | null
  site_url: string | null
  publicavel: boolean
  arquivado: boolean
  rascunho: boolean
  criado_em: string
  membros: Membro[]
  vps: VpsResumo | null
  tem_credencial: boolean
}

export interface ProjetoCreate {
  nome: string
  descricao?: string | null
  origem: Origem
  tem_autenticacao?: boolean
  tem_vps?: boolean
  ssh_ip?: string | null
  vps_id?: string | null
  github_url?: string | null
  site_url?: string | null
  publicavel?: boolean
  rascunho?: boolean
}

export type ProjetoUpdate = Partial<ProjetoCreate & { arquivado: boolean }>

export interface CredencialResponse {
  projeto_id: string
  usuario: string
  senha_mascara: string
  atualizado_em: string
}

export interface CredencialReveal {
  usuario: string
  senha: string
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

export const projetosApi = {
  list: (params?: { origem?: Origem; arquivado?: boolean }) => {
    const qs = new URLSearchParams()
    if (params?.origem) qs.set("origem", params.origem)
    if (params?.arquivado !== undefined) qs.set("arquivado", String(params.arquivado))
    return request<Projeto[]>(`/projetos?${qs}`)
  },
  get: (id: string) => request<Projeto>(`/projetos/${id}`),
  gerarDescricao: (github_url: string) =>
    request<{ descricao: string }>(`/projetos/gerar-descricao`, {
      method: "POST",
      body: JSON.stringify({ github_url }),
    }),
  create: (body: ProjetoCreate) =>
    request<Projeto>("/projetos", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: ProjetoUpdate) =>
    request<Projeto>(`/projetos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  addMembro: (id: string, body: { nome: string; contato?: string }) =>
    request<Membro>(`/projetos/${id}/membros`, { method: "POST", body: JSON.stringify(body) }),
  removeMembro: (projetoId: string, membroId: string) =>
    request<void>(`/projetos/${projetoId}/membros/${membroId}`, { method: "DELETE" }),

  // Credencial de login do site (1 por projeto)
  getCredencial: (id: string) => request<CredencialResponse>(`/projetos/${id}/credencial`),
  upsertCredencial: (id: string, body: { usuario: string; senha: string }) =>
    request<CredencialResponse>(`/projetos/${id}/credencial`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  revelarCredencial: (id: string) =>
    request<CredencialReveal>(`/projetos/${id}/credencial/revelar`),
  removeCredencial: (id: string) =>
    request<void>(`/projetos/${id}/credencial`, { method: "DELETE" }),
}
