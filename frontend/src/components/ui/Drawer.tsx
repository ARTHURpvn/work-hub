import { useEffect, type MouseEvent, type ReactNode } from "react"
import { IconButton } from "./kit"

interface DrawerProps {
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({ onClose, title, children, footer }: DrawerProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  const stop = (e: MouseEvent) => e.stopPropagation()
  const backdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay" style={{ padding: 0 }} onMouseDown={backdrop}>
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
