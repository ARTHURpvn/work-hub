import { Menu } from "lucide-react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useUiStore } from "@/store/uiStore"

export function AppLayout() {
  const { mobileOpen, setMobileOpen } = useUiStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar fixa no desktop */}
      <div className="hidden md:flex h-full flex-col">
        <Sidebar />
      </div>

      {/* Drawer off-canvas no mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 z-50 h-full shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            className="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold tracking-tight">workhub</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
