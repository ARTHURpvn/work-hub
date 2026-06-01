import type { ReactNode } from "react"

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

/** Estado vazio padrão: ícone + título + descrição + ação clara. */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon && (
        <div className="rounded-full bg-muted p-3 text-muted-foreground">{icon}</div>
      )}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
