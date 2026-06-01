import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiLogin, apiMe } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

export function Login() {
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)

  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [totpRequired, setTotpRequired] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await apiLogin({ password, totp_code: totpRequired ? totpCode : undefined })

      if (result.totp_required) {
        setTotpRequired(true)
        setLoading(false)
        return
      }

      const me = await apiMe()
      setAuthenticated(me.email, me.totp_enabled)
      navigate("/", { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">workhub</h1>
          <p className="text-sm text-muted-foreground">Entre com sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              disabled={totpRequired}
            />
          </div>

          {totpRequired && (
            <div className="space-y-2">
              <Label htmlFor="totp">Código 2FA (TOTP)</Label>
              <Input
                id="totp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : totpRequired ? "Verificar código" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  )
}
