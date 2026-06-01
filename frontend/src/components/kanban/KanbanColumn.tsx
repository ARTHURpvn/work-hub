import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./KanbanCard"
import type { Status, Tarefa } from "@/api/tarefas"

const columnStyle: Record<Status, { dot: string; header: string }> = {
  "A Fazer": { dot: "bg-slate-400", header: "text-foreground" },
  "Em Andamento": { dot: "bg-sky-400", header: "text-foreground" },
  "Em Revisao": { dot: "bg-amber-400", header: "text-foreground" },
  Concluido: { dot: "bg-emerald-400", header: "text-foreground" },
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
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
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
        className={`flex-1 rounded-xl border border-border/60 bg-muted/30 p-2 space-y-2 min-h-[120px] transition-colors ${isOver ? "ring-2 ring-primary/50" : ""}`}
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
