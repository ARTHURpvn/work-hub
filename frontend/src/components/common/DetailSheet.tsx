import { Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Sheet } from "@/components/ui/sheet"

export type DetailMode = "view" | "edit"

interface DetailSheetProps {
  open: boolean
  onClose: () => void
  title: string
  mode: DetailMode
  onEdit: () => void
  /** Esconde o botão Editar (ex.: criação de um novo registro). */
  showEditButton?: boolean
  children: ReactNode
}

/**
 * Sheet padrão "ver primeiro, editar depois": em modo `view` exibe um botão
 * Editar no topo; o conteúdo (read-only ou formulário) é controlado pelo pai.
 */
export function DetailSheet({
  open,
  onClose,
  title,
  mode,
  onEdit,
  showEditButton = true,
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {mode === "view" && showEditButton && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Editar
          </Button>
        </div>
      )}
      {children}
    </Sheet>
  )
}

interface DetailFieldProps {
  label: string
  children: ReactNode
}

/** Linha label + valor para visualização read-only. */
export function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}
