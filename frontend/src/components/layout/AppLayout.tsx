import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { TarefaModal } from "@/components/tarefas/TarefaModal"
import { SearchPalette } from "./SearchPalette"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export function AppLayout() {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [search, setSearch] = useState(false)

  useEffect(() => {
    document.body.classList.toggle("nav-open", navOpen)
    return () => document.body.classList.remove("nav-open")
  }, [navOpen])

  // fecha o drawer mobile ao trocar de rota
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearch(true)
      }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  return (
    <>
      <div className="app">
        <div className="scrim-side" onClick={() => setNavOpen(false)} />
        <Sidebar onNavigate={() => setNavOpen(false)} />
        <div className="main">
          <Topbar onMenu={() => setNavOpen(true)} onSearch={() => setSearch(true)} />
          <div className="scroll">
            <div className="fade-in" key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>

      {search && <SearchPalette onClose={() => setSearch(false)} />}
      <TarefaModal />
    </>
  )
}
