import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, GripVertical, RotateCcw } from "lucide-react"
import type { Tarefa } from "@/api/tarefas"

const prioridadeColor: Record<string, string> = {
  alta: "text-red-300 bg-red-500/15 border-red-500/25",
  media: "text-sky-300 bg-sky-500/15 border-sky-500/25",
  baixa: "text-muted-foreground bg-muted border-border",
}

interface Props {
  tarefa: Tarefa
  onClick: () => void
}

export function KanbanCard({ tarefa, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tarefa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const prazoDate = tarefa.prazo ? new Date(tarefa.prazo) : null
  const prazoStr = prazoDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  const atrasada = prazoDate && prazoDate < new Date() && tarefa.status !== "Concluido"

  return (
    // O card INTEIRO é arrastável. PointerSensor (distance:5) diferencia clique de arraste,
    // então um clique simples abre a tarefa e mover >5px inicia o drag.
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group touch-none rounded-lg border bg-card p-3 shadow-sm cursor-grab select-none transition-colors hover:border-primary/40 active:cursor-grabbing
        ${tarefa.retornou_de_revisao ? "border-amber-500/40 bg-amber-500/5" : ""}
        ${isDragging ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"}
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-1 flex-wrap">
            {tarefa.retornou_de_revisao && (
              <span title={`Voltou de revisão ${tarefa.revisao_retornos}×`}>
                <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              </span>
            )}
            <span className={`text-sm font-medium leading-snug ${tarefa.status === "Concluido" ? "text-muted-foreground line-through" : ""}`}>
              {tarefa.titulo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`rounded border px-1.5 py-0.5 text-xs ${prioridadeColor[tarefa.prioridade] ?? ""}`}>
              {tarefa.prioridade}
            </span>
            {tarefa.subtarefas.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ✓ {tarefa.subtarefas.filter((s) => s.concluida).length}/{tarefa.subtarefas.length}
              </span>
            )}
            {prazoStr && (
              <span className={`flex items-center gap-0.5 text-xs ${atrasada ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                <Calendar className="h-3 w-3" />
                {prazoStr}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Card fantasma durante o drag (placeholder na coluna de origem)
export function KanbanCardOverlay({ tarefa }: { tarefa: Tarefa }) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-xl ring-2 ring-primary opacity-90">
      <span className="text-sm font-medium">{tarefa.titulo}</span>
    </div>
  )
}
