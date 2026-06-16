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

export interface SkillArquivo {
  caminho: string
  conteudo: string
}

export interface SkillDetalhe extends Skill {
  conteudo: string
  arquivos: SkillArquivo[]
}

export interface SkillChatResponse {
  reply: string
  sugestao_conteudo: string | null
  sugestao_arquivos: SkillArquivo[] | null
  demonstracao: string | null
}

export interface SkillChatMsg {
  id: string
  role: "user" | "assistant"
  content: string
  sugestao_conteudo: string | null
  sugestao_arquivos: SkillArquivo[] | null
  demonstracao: string | null
  criado_em: string
}

export interface AssistenteAcao {
  tipo: "criar" | "editar"
  name: string
  display_title: string
  descricao: string | null
  conteudo: string
  arquivos: SkillArquivo[]
}

export interface AssistenteResponse {
  reply: string
  acoes: AssistenteAcao[]
}

export interface AssistenteStatus {
  fase: "conectando" | "pensando" | "gerando" | string
  elapsed: number
  chars: number
}

export interface AssistenteStreamHandlers {
  onStatus?: (s: AssistenteStatus) => void
  onDone: (r: AssistenteResponse) => void
  onError: (msg: string) => void
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
  create: (body: { display_title: string; conteudo: string; arquivos?: SkillArquivo[] }) =>
    request<SkillDetalhe>("/skills", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { conteudo: string; display_title?: string; arquivos?: SkillArquivo[] }) =>
    request<SkillDetalhe>(`/skills/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/skills/${id}`, { method: "DELETE" }),
  migrar: () => request<MigrarResultado>("/skills/migrar", { method: "POST" }),
  chat: (id: string, mensagem: string) =>
    request<SkillChatResponse>(`/skills/${id}/chat`, { method: "POST", body: JSON.stringify({ mensagem }) }),
  getChat: (id: string) => request<SkillChatMsg[]>(`/skills/${id}/chat`),
  clearChat: (id: string) => request<void>(`/skills/${id}/chat`, { method: "DELETE" }),
  assistente: (mensagens: { role: "user" | "assistant"; content: string }[]) =>
    request<AssistenteResponse>("/skills/assistente/chat", { method: "POST", body: JSON.stringify({ mensagens }) }),
  assistenteStream: async (
    mensagens: { role: "user" | "assistant"; content: string }[],
    h: AssistenteStreamHandlers,
  ): Promise<void> => {
    let res: Response
    try {
      res = await fetch("/api/v1/skills/assistente/chat/stream", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens }),
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
    let concluido = false // recebeu done ou error

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
      if (evento === "status") h.onStatus?.(payload as AssistenteStatus)
      else if (evento === "done") {
        concluido = true
        h.onDone(payload as AssistenteResponse)
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
    // flush final: processa um último frame que não terminou em \n\n
    buf += dec.decode()
    if (buf.trim()) processarFrame(buf.trim())
    // stream terminou sem done/error → não deixa o spinner travado
    if (!concluido) h.onError("A resposta foi interrompida antes de concluir. Tente novamente.")
  },
}
