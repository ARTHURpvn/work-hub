import type { ReactNode } from "react"

interface Props {
  title: string
  description?: string
  action?: ReactNode
}

/** Cabeçalho padrão de página: título (+ descrição) e ação à direita. */
export function PageHeader({ title, description, action }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
