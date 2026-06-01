import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"
import { useToastStore, type ToastVariant } from "@/store/toastStore"
import { cn } from "@/lib/utils"

const styles: Record<ToastVariant, { icon: React.ReactNode; cls: string }> = {
  success: { icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />, cls: "border-emerald-500/30" },
  error: { icon: <AlertCircle className="h-4 w-4 text-red-400" />, cls: "border-red-500/30" },
  info: { icon: <Info className="h-4 w-4 text-sky-400" />, cls: "border-sky-500/30" },
}

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover px-4 py-3 text-popover-foreground shadow-lg",
            styles[t.variant].cls
          )}
          role="status"
        >
          <span className="mt-0.5">{styles[t.variant].icon}</span>
          <div className="flex-1 text-sm">
            <p className="font-medium">{t.title}</p>
            {t.description && <p className="text-muted-foreground">{t.description}</p>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
