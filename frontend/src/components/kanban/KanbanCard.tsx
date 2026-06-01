import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, GripVertical, RotateCcw } from "lucide-react"
import type { Tarefa } from "@/api/tarefas"

const prioridadeColor: Record<string, string> = {
  alta: "text-red-600 bg-red-50 border-red-200",
  media: "text-blue-600 bg-blue-50 border-blue-200",
  baixa: "text-gray-500 bg-gray-50 border-gray-200",
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
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-background p-3 shadow-sm cursor-pointer select-none
        ${tarefa.retornou_de_revisao ? "border-orange-300 bg-orange-50/30" : ""}
        ${isDragging ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md"}
      `}
    >
      {/* Grip + título */}
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 touch-none text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          aria-label="Arrastar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button onClick={onClick} className="flex-1 text-left space-y-2">
          <div className="flex items-start gap-1 flex-wrap">
            {tarefa.retornou_de_revisao && (
              <span title={`Voltou de revisão ${tarefa.revisao_retornos}×`}>
                <RotateCcw className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
              </span>
            )}
            <span className={`text-sm font-medium leading-snug ${tarefa.status === "Concluido" ? "line-through text-muted-foreground" : ""}`}>
              {tarefa.titulo}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {tarefa.retornou_de_revisao && (
              <span className="text-xs text-orange-600 font-medium">↩ {tarefa.revisao_retornos}</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded border ${prioridadeColor[tarefa.prioridade] ?? ""}`}>
              {tarefa.prioridade}
            </span>
            {prazoStr && (
              <span className={`flex items-center gap-0.5 text-xs ${atrasada ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                <Calendar className="h-3 w-3" />
                {prazoStr}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  )
}

// Card fantasma durante o drag (placeholder na coluna de origem)
export function KanbanCardOverlay({ tarefa }: { tarefa: Tarefa }) {
  return (
    <div className="rounded-lg border bg-background p-3 shadow-xl ring-2 ring-primary opacity-90">
      <span className="text-sm font-medium">{tarefa.titulo}</span>
    </div>
  )
}
