import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useState } from "react"
import { KanbanCardOverlay } from "./KanbanCard"
import { KanbanColumn } from "./KanbanColumn"
import { useUpdateStatus } from "@/hooks/useTarefas"
import type { Status, Tarefa } from "@/api/tarefas"

const COLUMNS: Status[] = ["A Fazer", "Em Andamento", "Em Revisao", "Concluido"]

interface Props {
  tarefas: Tarefa[]
  onCardClick: (t: Tarefa) => void
  onError: (msg: string) => void
}

export function KanbanBoard({ tarefas, onCardClick, onError }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const updateStatus = useUpdateStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const activeTarefa = activeId ? tarefas.find((t) => t.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const tarefa = tarefas.find((t) => t.id === active.id)
    if (!tarefa) return

    // over.id pode ser o ID da coluna (Status) ou o ID de outro card
    const newStatus = COLUMNS.includes(over.id as Status)
      ? (over.id as Status)
      : tarefas.find((t) => t.id === over.id)?.status

    if (!newStatus || newStatus === tarefa.status) return

    updateStatus.mutate(
      { id: tarefa.id, status: newStatus },
      {
        onError: () => onError("Erro ao atualizar status. O card foi revertido."),
      }
    )
  }

  const byStatus = (s: Status) => tarefas.filter((t) => t.status === s)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            status={col}
            tarefas={byStatus(col)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTarefa ? <KanbanCardOverlay tarefa={activeTarefa} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
