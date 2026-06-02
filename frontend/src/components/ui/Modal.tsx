import { useEffect, type MouseEvent, type ReactNode } from "react"
import { IconButton } from "./kit"

interface ModalProps {
  open?: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: "lg"
}

export function Modal({ open = true, onClose, title, children, footer, size }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  if (!open) return null

  const stop = (e: MouseEvent) => e.stopPropagation()
  const backdrop = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="overlay" onMouseDown={backdrop}>
      <div className={size === "lg" ? "modal lg" : "modal"} onMouseDown={stop}>
        {title !== undefined && (
          <div className="modal-head">
            {typeof title === "string" ? <h3>{title}</h3> : title}
            <IconButton name="x" size={18} onClick={onClose} />
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
