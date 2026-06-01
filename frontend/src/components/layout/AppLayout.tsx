import { Menu } from "lucide-react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { useUiStore } from "@/store/uiStore"

export function AppLayout() {
  const { toggleSidebar } = useUiStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar — oculta em mobile via CSS, drawer em tela pequena */}
      <div className="hidden md:flex h-full flex-col">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar mobile */}
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <button onClick={toggleSidebar} aria-label="Abrir menu" className="mr-3">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-lg font-bold">workhub</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
