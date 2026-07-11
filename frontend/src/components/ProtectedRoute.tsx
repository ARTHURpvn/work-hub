import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { apiMe } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"

interface Props {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, setAuthenticated } = useAuthStore()
  const [checking, setChecking] = useState(!isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) return

    apiMe()
      .then((me) => setAuthenticated(me.email, me.totp_enabled))
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [isAuthenticated, setAuthenticated])

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm">Verificando sessão...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
