export interface ConfigItem {
  chave: string
  label: string
  secret: boolean
  placeholder: string
  ajuda: string
  configurado: boolean
  valor: string | null
  mascara: string | null
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

export const configApi = {
  list: () => request<ConfigItem[]>("/config"),
  set: (chave: string, valor: string) =>
    request<ConfigItem[]>(`/config/${chave}`, { method: "PUT", body: JSON.stringify({ valor }) }),
  remove: (chave: string) => request<ConfigItem[]>(`/config/${chave}`, { method: "DELETE" }),
}
