import { useState } from "react"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { TarefaSheet } from "@/components/tarefas/TarefaSheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useTarefas } from "@/hooks/useTarefas"
import type { Tarefa } from "@/api/tarefas"

export function Kanban() {
  const { data: tarefas, isLoading, isError } = useTarefas()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState<string | undefined>()
  const [dragError, setDragError] = useState("")

  const tarefaSelecionada: Tarefa | undefined = selecionadaId
    ? tarefas?.find((t) => t.id === selecionadaId)
    : undefined

  function handleCardClick(t: Tarefa) {
    setSelecionadaId(t.id)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban</h1>
      </div>

      {dragError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between">
          {dragError}
          <button onClick={() => setDragError("")} className="ml-4 text-xs underline">fechar</button>
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar tarefas.
        </div>
      )}

      {isLoading && (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-64 rounded-xl shrink-0" />
          ))}
        </div>
      )}

      {!isLoading && !isError && tarefas && (
        <KanbanBoard
          tarefas={tarefas}
          onCardClick={handleCardClick}
          onError={setDragError}
        />
      )}

      <TarefaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tarefa={tarefaSelecionada}
      />
    </div>
  )
}
