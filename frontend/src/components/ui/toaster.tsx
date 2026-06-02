import { useToastStore } from "@/store/toastStore"
import { Icon } from "./Icon"

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={t.variant === "error" ? "toast error" : "toast"} role="status">
          <Icon name={t.variant === "error" ? "alert" : "check"} size={16} />
          <span>{t.description ? `${t.title} — ${t.description}` : t.title}</span>
        </div>
      ))}
    </div>
  )
}
