export type SkillOrigem = "pessoal" | "plugin" | "desktop"

export interface SkillResumo {
  slug: string
  name: string
  description: string | null
  origem: SkillOrigem
  editavel: boolean
}

export interface Skill extends SkillResumo {
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

export const skillsApi = {
  list: () => request<SkillResumo[]>("/skills"),
  get: (origem: SkillOrigem, slug: string) => request<Skill>(`/skills/${origem}/${slug}`),
  create: (body: { slug: string; name: string; description: string }) =>
    request<Skill>("/skills", { method: "POST", body: JSON.stringify(body) }),
  update: (slug: string, conteudo: string) =>
    request<Skill>(`/skills/pessoal/${slug}`, { method: "PUT", body: JSON.stringify({ conteudo }) }),
  remove: (slug: string) => request<void>(`/skills/pessoal/${slug}`, { method: "DELETE" }),
  importar: (origem: SkillOrigem, slug: string) =>
    request<Skill>(`/skills/${origem}/${slug}/importar`, { method: "POST" }),
  melhorar: (slug: string) =>
    request<{ sugestao: string }>(`/skills/pessoal/${slug}/melhorar`, { method: "POST" }),
  chat: (slug: string, mensagens: ChatMensagem[]) =>
    request<SkillChatResponse>(`/skills/pessoal/${slug}/chat`, {
      method: "POST",
      body: JSON.stringify({ mensagens }),
    }),
}
