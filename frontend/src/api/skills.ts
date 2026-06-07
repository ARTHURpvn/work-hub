import { onUnauthorized } from "@/lib/session"
export interface Skill {
  id: string
  skill_id: string
  name: string
  display_title: string
  descricao: string | null
  versao_atual: string | null
  atualizado_em: string
}

export interface SkillDetalhe extends Skill {
  conteudo: string
}

export interface ChatMensagem {
  role: "user" | "assistant"
  content: string
}

export interface SkillChatResponse {
  reply: string
  sugestao_conteudo: string | null
}

export interface MigrarErro {
  name: string
  erro: string
}

export interface MigrarResultado {
  criadas: number
  puladas: number
  erros: MigrarErro[]
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

export const skillsApi = {
  list: () => request<Skill[]>("/skills"),
  get: (id: string) => request<SkillDetalhe>(`/skills/${id}`),
  create: (body: { display_title: string; conteudo: string }) =>
    request<SkillDetalhe>("/skills", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { conteudo: string; display_title?: string }) =>
    request<SkillDetalhe>(`/skills/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/skills/${id}`, { method: "DELETE" }),
  migrar: () => request<MigrarResultado>("/skills/migrar", { method: "POST" }),
  chat: (id: string, mensagens: ChatMensagem[]) =>
    request<SkillChatResponse>(`/skills/${id}/chat`, { method: "POST", body: JSON.stringify({ mensagens }) }),
}
