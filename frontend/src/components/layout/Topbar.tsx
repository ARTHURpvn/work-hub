import { Icon } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/kit"
import { useThemeStore } from "@/store/themeStore"

interface TopbarProps {
  onMenu: () => void
  onSearch: () => void
}

export function Topbar({ onMenu, onSearch }: TopbarProps) {
  const { theme, setTheme } = useThemeStore()

  return (
    <header className="topbar">
      <IconButton name="menu" className="burger" onClick={onMenu} aria-label="Abrir menu" />

      <div className="search" onClick={onSearch}>
        <Icon name="search" size={16} />
        <input
          placeholder="Buscar projetos, tarefas…"
          readOnly
          onFocus={onSearch}
          style={{ cursor: "pointer" }}
        />
        <kbd>⌘K</kbd>
      </div>

      <div className="topbar-actions">
        <div className="seg">
          <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-label="Tema claro">
            <Icon name="sun" size={15} />
          </button>
          <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-label="Tema escuro">
            <Icon name="moon" size={15} />
          </button>
        </div>
        <div className="avatar" title="Você">
          EU
        </div>
      </div>
    </header>
  )
}
