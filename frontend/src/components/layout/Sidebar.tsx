import {
  BarChart2,
  Bot,
  CalendarDays,
  FolderOpen,
  Kanban,
  ListTodo,
  Server,
  Settings,
  Wrench,
  Zap,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useUiStore } from "@/store/uiStore"

const navItems = [
  { to: "/", label: "Dashboard", icon: BarChart2, exact: true },
  { to: "/projetos", label: "Projetos", icon: FolderOpen },
  { to: "/tarefas", label: "Tarefas", icon: ListTodo },
  { to: "/kanban", label: "Kanban", icon: Kanban },
  { to: "/vps", label: "VPS", icon: Server },
  { to: "/calendario", label: "Calendário", icon: CalendarDays, disabled: true },
  { to: "/agentes", label: "Agentes", icon: Bot, disabled: true },
  { to: "/jobs", label: "Jobs", icon: Zap, disabled: true },
  { to: "/skills", label: "Skills", icon: Wrench, disabled: true },
]

export function Sidebar() {
  const { sidebarCollapsed } = useUiStore()

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight">workhub</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} collapsed={sidebarCollapsed} />
        ))}
      </nav>

      <div className="border-t p-2">
        <NavItem
          to="/configuracoes"
          label="Configurações"
          icon={Settings}
          collapsed={sidebarCollapsed}
          disabled
        />
      </div>
    </aside>
  )
}

interface NavItemProps {
  to: string
  label: string
  icon: React.ElementType
  collapsed: boolean
  exact?: boolean
  disabled?: boolean
}

function NavItem({ to, label, icon: Icon, collapsed, exact, disabled }: NavItemProps) {
  if (disabled) {
    return (
      <div
        className={cn(
          "flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground opacity-50",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </div>
    )
  }

  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-accent text-accent-foreground font-medium",
          collapsed && "justify-center px-2"
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
