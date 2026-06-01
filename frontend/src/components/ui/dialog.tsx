import { X } from "lucide-react"
import * as React from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  headerAction?: ReactNode
  children: ReactNode
  className?: string
}

/** Modal centralizado (overlay + card no meio da tela). Fecha no Esc e no overlay. */
export function Dialog({ open, onClose, title, headerAction, children, className }: DialogProps) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        className={cn(
          "relative z-10 my-4 w-full max-w-lg rounded-xl border bg-card shadow-2xl sm:my-8",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0 truncate text-lg font-semibold">{title}</div>
          <div className="flex shrink-0 items-center gap-2">
            {headerAction}
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-sm opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
