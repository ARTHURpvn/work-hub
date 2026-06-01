export interface LoginPayload {
  password: string
  totp_code?: string
}

export interface MeResponse {
  email: string
  totp_enabled: boolean
}

export async function apiLogin(payload: LoginPayload): Promise<{ totp_required?: boolean; ok?: boolean }> {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.detail ?? "Erro ao fazer login")
  }
  return res.json()
}

export async function apiLogout(): Promise<void> {
  await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" })
}

export async function apiMe(): Promise<MeResponse> {
  const res = await fetch("/api/v1/auth/me", { credentials: "include" })
  if (!res.ok) throw new Error("Não autenticado")
  return res.json()
}
