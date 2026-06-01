import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./KanbanCard"
import type { Status, Tarefa } from "@/api/tarefas"

const columnStyle: Record<Status, { header: string; bg: string }> = {
  "A Fazer": { header: "text-gray-700", bg: "bg-gray-50" },
  "Em Andamento": { header: "text-blue-700", bg: "bg-blue-50" },
  "Em Revisao": { header: "text-yellow-700", bg: "bg-yellow-50" },
  Concluido: { header: "text-green-700", bg: "bg-green-50" },
}

const columnLabel: Record<Status, string> = {
  "A Fazer": "A Fazer",
  "Em Andamento": "Em Andamento",
  "Em Revisao": "Em Revisão",
  Concluido: "Concluído",
}

interface Props {
  status: Status
  tarefas: Tarefa[]
  onCardClick: (t: Tarefa) => void
}

export function KanbanColumn({ status, tarefas, onCardClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const style = columnStyle[status]

  return (
    <div className="flex flex-col gap-2 min-w-[260px] flex-1">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <span className={`text-sm font-semibold ${style.header}`}>
          {columnLabel[status]}
        </span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {tarefas.length}
        </span>
      </div>

      {/* Coluna droppable */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-xl p-2 space-y-2 min-h-[120px] transition-colors ${style.bg} ${isOver ? "ring-2 ring-primary/50" : ""}`}
      >
        <SortableContext items={tarefas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tarefas.map((t) => (
            <KanbanCard key={t.id} tarefa={t} onClick={() => onCardClick(t)} />
          ))}
        </SortableContext>

        {tarefas.length === 0 && (
          <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
            Sem tarefas
          </div>
        )}
      </div>
    </div>
  )
}
