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
  brief: string | null
  criado_em: string
  membros: Membro[]
  vps: VpsResumo | null
  tem_credencial: boolean
}

export interface IdeiaChatMsg {
  id: string
  role: "user" | "assistant"
  content: string
  criado_em: string
}

export interface IdeiaStatus {
  fase: string
  elapsed: number
  chars: number
}

export interface IdeiaStreamHandlers {
  onStatus?: (s: IdeiaStatus) => void
  onDone: (r: { reply: string }) => void
  onError: (msg: string) => void
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

// Ideia: brief + chat de co-escrita com IA
export const ideiaApi = {
  getChat: (id: string) => request<IdeiaChatMsg[]>(`/projetos/${id}/chat`),
  clearChat: (id: string) => request<void>(`/projetos/${id}/chat`, { method: "DELETE" }),
  saveBrief: (id: string, brief: string) =>
    request<Projeto>(`/projetos/${id}/brief`, { method: "PUT", body: JSON.stringify({ brief }) }),
  chatStream: async (id: string, mensagem: string, h: IdeiaStreamHandlers): Promise<void> => {
    let res: Response
    try {
      res = await fetch(`/api/v1/projetos/${id}/chat/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem }),
      })
    } catch {
      h.onError("Falha de conexão.")
      return
    }
    if (res.status === 401) {
      onUnauthorized()
      h.onError("Sessão expirada.")
      return
    }
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}))
      h.onError(data?.detail ?? `Erro ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ""
    let concluido = false

    const processarFrame = (frame: string) => {
      let evento = "message"
      let data = ""
      for (const linha of frame.split("\n")) {
        if (linha.startsWith("event:")) evento = linha.slice(6).trim()
        else if (linha.startsWith("data:")) data += linha.slice(5).trimStart()
      }
      if (!data) return
      let payload: unknown
      try {
        payload = JSON.parse(data)
      } catch {
        return
      }
      if (evento === "status") h.onStatus?.(payload as IdeiaStatus)
      else if (evento === "done") {
        concluido = true
        h.onDone(payload as { reply: string })
      } else if (evento === "error") {
        concluido = true
        h.onError((payload as { detail?: string })?.detail ?? "Erro na IA")
      }
    }

    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let sep: number
      while ((sep = buf.indexOf("\n\n")) !== -1) {
        processarFrame(buf.slice(0, sep))
        buf = buf.slice(sep + 2)
      }
    }
    buf += dec.decode()
    if (buf.trim()) processarFrame(buf.trim())
    if (!concluido) h.onError("A resposta foi interrompida antes de concluir. Tente novamente.")
  },
}
