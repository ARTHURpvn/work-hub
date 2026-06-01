import { create } from "zustand"

interface AuthState {
  isAuthenticated: boolean
  email: string | null
  totpEnabled: boolean
  setAuthenticated: (email: string, totpEnabled: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  totpEnabled: false,
  setAuthenticated: (email, totpEnabled) => set({ isAuthenticated: true, email, totpEnabled }),
  clearAuth: () => set({ isAuthenticated: false, email: null, totpEnabled: false }),
}))
