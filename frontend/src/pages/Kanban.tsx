import { useMemo, useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { FilterBar } from "@/components/common/FilterBar"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"
import { TarefaModal } from "@/components/tarefas/TarefaModal"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjetos } from "@/hooks/useProjetos"
import { useTarefas } from "@/hooks/useTarefas"
import type { Tarefa } from "@/api/tarefas"

export function Kanban() {
  const { data: tarefas, isLoading, isError } = useTarefas()
  const { data: projetos } = useProjetos({ arquivado: false })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState<string | undefined>()
  const [dragError, setDragError] = useState("")
  const [projetoFiltro, setProjetoFiltro] = useState("")

  const tarefaSelecionada: Tarefa | undefined = selecionadaId
    ? tarefas?.find((t) => t.id === selecionadaId)
    : undefined

  const visiveis = useMemo(() => {
    if (!tarefas) return []
    if (!projetoFiltro) return tarefas
    return tarefas.filter((t) => t.projeto_id === projetoFiltro)
  }, [tarefas, projetoFiltro])

  function handleCardClick(t: Tarefa) {
    setSelecionadaId(t.id)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Kanban" />

      <FilterBar>
        <Select
          value={projetoFiltro}
          onChange={(e) => setProjetoFiltro(e.target.value)}
          className="h-9 w-auto"
        >
          <option value="">Todos os projetos</option>
          {projetos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </Select>
      </FilterBar>

      {dragError && (
        <div className="flex items-center justify-between rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
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
        <KanbanBoard tarefas={visiveis} onCardClick={handleCardClick} onError={setDragError} />
      )}

      <TarefaModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tarefa={tarefaSelecionada}
      />
    </div>
  )
}
