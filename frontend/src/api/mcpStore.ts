import { onUnauthorized } from "@/lib/session"

export interface StoreEnv {
  name: string
  description: string | null
  required: boolean
  secret: boolean
}

export interface StoreServer {
  name: string
  suggested_name: string
  title: string | null
  description: string | null
  version: string | null
  transport: string
  package_kind: string | null
  command: string | null
  args: string[]
  url: string | null
  env_required: StoreEnv[]
  source_url: string | null
  install_command: string
  mcp_json: Record<string, unknown>
}

export interface ImportResult {
  id: string
  name: string
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
  return res.json()
}

export const mcpStoreApi = {
  search: (q: string) =>
    request<StoreServer[]>(`/mcp-store/search?q=${encodeURIComponent(q)}`),
  import: (name: string, name_local?: string) =>
    request<ImportResult>("/mcp-store/import", {
      method: "POST",
      body: JSON.stringify({ name, name_local }),
    }),
}
