import { useEffect, type MouseEvent, type ReactNode } from "react"
import { IconButton } from "./kit"

interface DrawerProps {
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Fecha no Esc. Passe false quando houver um Modal aberto por cima (evita fechar os dois). */
  escClose?: boolean
  /** Escurece o fundo. Passe false quando um Modal cobrir o drawer (evita scrim duplo). */
  dim?: boolean
}

export function Drawer({ onClose, title, children, footer, escClose = true, dim = true }: DrawerProps) {
  useEffect(() => {
    if (!escClose) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose, escClose])

  const stop = (e: MouseEvent) => e.stopPropagation()
  const backdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="overlay"
      style={{ padding: 0, ...(dim ? {} : { background: "transparent", backdropFilter: "none" }) }}
      onMouseDown={backdrop}
    >
      <div className="drawer" onMouseDown={stop}>
        <div className="drawer-head">
          {typeof title === "string" ? <h3 style={{ flex: 1, fontSize: 16 }}>{title}</h3> : title}
          <IconButton name="x" size={18} onClick={onClose} />
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </div>
  )
}
