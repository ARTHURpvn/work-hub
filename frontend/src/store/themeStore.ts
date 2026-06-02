import { create } from "zustand"

export type Theme = "light" | "dark"

const LS_KEY = "workhub.theme"

function apply(theme: Theme): void {
  document.body.classList.toggle("dark", theme === "dark")
}

function read(): Theme {
  try {
    const v = localStorage.getItem(LS_KEY)
    if (v === "light" || v === "dark") return v
  } catch {
    /* ignore */
  }
  return "dark"
}

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: read(),
  setTheme: (theme) => {
    apply(theme)
    try {
      localStorage.setItem(LS_KEY, theme)
    } catch {
      /* ignore */
    }
    set({ theme })
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}))

/** Aplica o tema salvo no boot, antes do primeiro render. */
export function initTheme(): void {
  apply(read())
}
