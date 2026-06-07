import { useAuthStore } from "@/store/authStore"
import { toast } from "@/store/toastStore"

let avisando = false

/**
 * Chamado quando uma requisição volta 401 (sessão expirada/ausente).
 * Limpa a autenticação (o ProtectedRoute redireciona para /login) e avisa.
 * Ignora quando já não está autenticado (ex.: tela de login) para não repetir.
 */
export function onUnauthorized(): void {
  const { isAuthenticated, clearAuth } = useAuthStore.getState()
  if (!isAuthenticated || avisando) return
  avisando = true
  clearAuth()
  toast.error("Sessão expirada", "Entre com sua senha novamente.")
  setTimeout(() => {
    avisando = false
  }, 1500)
}
