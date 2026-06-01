import { create } from "zustand"

interface UiStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  mobileOpen: false,
  setMobileOpen: (open) => set({ mobileOpen: open }),
}))
