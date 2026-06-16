import { onUnauthorized } from "@/lib/session"

export interface ParConfig {
  key: string
  value: string
  secret: boolean
}

export interface McpServer {
  id: string
  name: string
  transport: "stdio" | "http"
  command: string | null
  args: string[] | null
  url: string | null
  env: ParConfig[]
  headers: ParConfig[]
  descricao: string | null
  atualizado_em: string
  skill_ids: string[]
}

export interface McpInput {
  name?: string
  transport: "stdio" | "http"
  command?: string | null
  args?: string[] | null
  url?: string | null
  env: ParConfig[]
  headers: ParConfig[]
  descricao?: string | null
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

export const mcpApi = {
  list: () => request<McpServer[]>("/mcp-servers"),
  create: (body: McpInput) => request<McpServer>("/mcp-servers", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: McpInput) =>
    request<McpServer>(`/mcp-servers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/mcp-servers/${id}`, { method: "DELETE" }),
}
