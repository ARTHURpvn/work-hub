import { onUnauthorized } from "@/lib/session"
export interface UsoAgg {
  chamadas: number
  input_tokens: number
  output_tokens: number
  tokens: number
  custo_usd: number
}

export interface UsoResumo {
  total: UsoAgg
  mes: UsoAgg
}

export interface ClaudeModelo {
  model: string
  input: number
  output: number
  cache: number
}

export interface ClaudeCodeUso {
  disponivel: boolean
  atualizado_em: string | null
  sessoes: number
  mensagens: number
  tokens_input: number
  tokens_output: number
  tokens_total: number
  cache_tokens: number
  por_modelo: ClaudeModelo[]
  hoje: { date: string | null; tokens: number } | null
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { credentials: "include" })
  if (!res.ok) {
    if (res.status === 401) onUnauthorized()
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail ?? `Erro ${res.status}`)
  }
  return res.json()
}

export const usoApi = {
  resumo: () => request<UsoResumo>("/uso"),
  claudeCode: () => request<ClaudeCodeUso>("/uso/claude-code"),
}
