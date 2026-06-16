import { onUnauthorized } from "@/lib/session"

export interface Plugin {
  id: string
  name: string
  display_title: string
  descricao: string | null
  version: string
  atualizado_em: string
  skill_ids: string[]
}

export interface PluginInput {
  name?: string
  display_title: string
  descricao?: string | null
  version?: string
  skill_ids: string[]
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

export const pluginsApi = {
  list: () => request<Plugin[]>("/plugins"),
  create: (body: PluginInput) => request<Plugin>("/plugins", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: PluginInput) =>
    request<Plugin>(`/plugins/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/plugins/${id}`, { method: "DELETE" }),
  /** Baixa o .zip do plugin; dispara o download no browser e devolve avisos do validate. */
  export: async (id: string, fallbackName: string): Promise<{ avisos: string[] }> => {
    const res = await fetch(`/api/v1/plugins/${id}/export`, { method: "POST", credentials: "include" })
    if (res.status === 401) {
      onUnauthorized()
      throw new Error("Sessão expirada.")
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.detail ?? `Erro ${res.status}`)
    }
    const avisosRaw = res.headers.get("X-Plugin-Avisos") || ""
    const avisos = avisosRaw ? decodeURIComponent(avisosRaw).split("; ").filter(Boolean) : []
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fallbackName}-marketplace.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return { avisos }
  },
}
