import { NavLink, useNavigate } from "react-router-dom"
import { apiLogout } from "@/api/auth"
import { Icon, type IconName } from "@/components/ui/Icon"
import { useProjetos } from "@/hooks/useProjetos"
import { useSkills } from "@/hooks/useSkills"
import { useVpsList } from "@/hooks/useVps"
import { useAuthStore } from "@/store/authStore"

interface NavEntry {
  to: string
  label: string
  icon: IconName
  key: "projetos" | "vps" | "skills" | null
  end?: boolean
}

interface NavGroup {
  title?: string
  items: NavEntry[]
}

const GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/", label: "Dashboard", icon: "dashboard", key: null, end: true },
      { to: "/projetos", label: "Projetos", icon: "folder", key: "projetos" },
      { to: "/donos", label: "Donos", icon: "user", key: null },
      { to: "/calendario", label: "Calendário", icon: "calendar", key: null },
      { to: "/vps", label: "VPS", icon: "server", key: "vps" },
      { to: "/ferramentas", label: "Ferramentas", icon: "key", key: null },
    ],
  },
  {
    title: "Claude",
    items: [
      { to: "/skills", label: "Skills", icon: "sparkle", key: "skills" },
      { to: "/subagents", label: "Subagents", icon: "bot", key: null },
      { to: "/mcp", label: "MCP", icon: "link", key: null },
      { to: "/mcp-store", label: "MCP Store", icon: "search", key: null },
      { to: "/hooks", label: "Hooks", icon: "clock", key: null },
      { to: "/commands", label: "Commands", icon: "send", key: null },
      { to: "/plugins", label: "Plugins", icon: "archive", key: null },
    ],
  },
  {
    title: "Automação",
    items: [{ to: "/rotinas", label: "Rotinas", icon: "refresh", key: null }],
  },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const { data: projetos } = useProjetos()
  const { data: vps } = useVpsList()
  const { data: skills } = useSkills()

  const counts: Record<string, number> = {
    projetos: (projetos ?? []).filter((p) => !p.arquivado && !p.rascunho).length,
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
        {GROUPS.map((g, gi) => (
          <div key={g.title ?? gi} className="nav-group">
            {gi > 0 && <div className="nav-sep" />}
            {g.title && <div className="nav-label">{g.title}</div>}
            {g.items.map((n) => {
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
          </div>
        ))}
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
