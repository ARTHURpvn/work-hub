import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { apiLogin, apiMe } from "@/api/auth"
import { Icon } from "@/components/ui/Icon"
import { Button, Field, IconButton } from "@/components/ui/kit"
import { useAuthStore } from "@/store/authStore"

export function Login() {
  const navigate = useNavigate()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)

  const [password, setPassword] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [totpRequired, setTotpRequired] = useState(false)
  const [show, setShow] = useState(false)
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
    <div className="login-screen">
      <form className="login-card fade-in" onSubmit={handleSubmit}>
        <div className="login-mark">w</div>
        <h1>workhub</h1>
        <p className="lead">Painel pessoal · digite sua senha</p>

        <Field label="Senha">
          <div className="input-icon">
            <Icon name="lock" />
            <input
              className="input"
              type={show ? "text" : "password"}
              value={password}
              autoFocus
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={totpRequired}
              style={{ paddingRight: 40 }}
            />
            <IconButton
              name={show ? "eyeoff" : "eye"}
              size={16}
              className="input-affix"
              style={{ width: 30, height: 30 }}
              onClick={() => setShow((s) => !s)}
              tabIndex={-1}
            />
          </div>
        </Field>

        {totpRequired && (
          <Field label="Código 2FA (TOTP)">
            <input
              className="input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              value={totpCode}
              autoFocus
              onChange={(e) => setTotpCode(e.target.value)}
            />
          </Field>
        )}

        <div className="login-err">{error}</div>

        <Button variant="primary" className="btn-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : totpRequired ? "Verificar código" : "Entrar"}
        </Button>

        <div className="login-foot">
          <Icon name="lock" size={13} style={{ color: "var(--muted)" }} />
          <span className="t-meta">Acesso protegido por senha.</span>
        </div>
      </form>
    </div>
  )
}
