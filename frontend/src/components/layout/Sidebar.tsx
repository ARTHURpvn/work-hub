import { NavLink, useNavigate } from "react-router-dom"
import { apiLogout } from "@/api/auth"
import { Icon, type IconName } from "@/components/ui/Icon"
import { useProjetos } from "@/hooks/useProjetos"
import { useSkills } from "@/hooks/useSkills"
import { useTarefas } from "@/hooks/useTarefas"
import { useVpsList } from "@/hooks/useVps"
import { useAuthStore } from "@/store/authStore"

interface NavEntry {
  to: string
  label: string
  icon: IconName
  key: "projetos" | "tarefas" | "vps" | "skills" | null
  end?: boolean
}

const NAV: NavEntry[] = [
  { to: "/", label: "Dashboard", icon: "dashboard", key: null, end: true },
  { to: "/projetos", label: "Projetos", icon: "folder", key: "projetos" },
  { to: "/tarefas", label: "Tarefas", icon: "check_list", key: "tarefas" },
  { to: "/kanban", label: "Kanban", icon: "board", key: null },
  { to: "/vps", label: "VPS", icon: "server", key: "vps" },
  { to: "/calendario", label: "Calendário", icon: "calendar", key: null },
  { to: "/skills", label: "Skills", icon: "sparkle", key: "skills" },
  { to: "/plugins", label: "Plugins", icon: "archive", key: null },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const { data: projetos } = useProjetos()
  const { data: tarefas } = useTarefas()
  const { data: vps } = useVpsList()
  const { data: skills } = useSkills()

  const counts: Record<string, number> = {
    projetos: (projetos ?? []).filter((p) => !p.arquivado).length,
    tarefas: (tarefas ?? []).filter((t) => t.status !== "Concluido").length,
    vps: (vps ?? []).length,
    skills: (skills ?? []).length,
  }

  async function logout() {
    await apiLogout().catch(() => {})
    clearAuth()
    navigate("/login", { replace: true })
  }

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark">w</div>
        <div className="brand-name">
          <b>w</b>orkhub
        </div>
      </div>

      <nav className="nav">
        {NAV.map((n) => {
          const c = n.key ? counts[n.key] : 0
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={onNavigate}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {c ? <span className="badge">{c}</span> : null}
            </NavLink>
          )
        })}

        <NavLink
          to="/rotinas"
          onClick={onNavigate}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <Icon name="clock" />
          <span>Rotinas</span>
        </NavLink>

        <div className="nav-sep" />
        <div className="nav-item disabled">
          <Icon name="bot" />
          <span>Agentes</span>
        </div>
      </nav>

      <div className="nav-foot">
        <div className="nav-sep" />

        <NavLink
          to="/configuracoes"
          onClick={onNavigate}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <Icon name="settings" />
          <span>Configurações</span>
        </NavLink>
        <button className="nav-item" onClick={logout}>
          <Icon name="logout" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
