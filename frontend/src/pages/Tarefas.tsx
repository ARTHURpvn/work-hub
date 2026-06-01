import { Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TarefaCard } from "@/components/tarefas/TarefaCard"
import { TarefaSheet } from "@/components/tarefas/TarefaSheet"
import { useTarefas } from "@/hooks/useTarefas"
import { useProjetos } from "@/hooks/useProjetos"
import { useTarefaStore } from "@/store/tarefaStore"
import type { Status, Tarefa } from "@/api/tarefas"

const STATUS_OPTS: Array<{ value: Status | undefined; label: string }> = [
  { value: undefined, label: "Todos" },
  { value: "A Fazer", label: "A Fazer" },
  { value: "Em Andamento", label: "Em Andamento" },
  { value: "Em Revisao", label: "Em Revisão" },
  { value: "Concluido", label: "Concluído" },
]

export function Tarefas() {
  const { filters, setFilter } = useTarefaStore()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState<string | undefined>()

  const { data: tarefas, isLoading, isError } = useTarefas({
    status: filters.status,
    projeto_id: filters.projeto_id,
    com_prazo: filters.com_prazo || undefined,
    order_by: filters.order_by,
    order_dir: filters.order_dir,
  })
  const { data: projetos } = useProjetos({ arquivado: false })

  const tarefaSelecionada: Tarefa | undefined = selecionadaId
    ? tarefas?.find((t) => t.id === selecionadaId)
    : undefined

  function handleEdit(t: Tarefa) {
    setSelecionadaId(t.id)
    setSheetOpen(true)
  }

  function handleNew() {
    setSelecionadaId(undefined)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nova tarefa
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        {STATUS_OPTS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => setFilter("status", opt.value)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              filters.status === opt.value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {/* Projeto */}
        <select
          value={filters.projeto_id ?? ""}
          onChange={(e) => setFilter("projeto_id", e.target.value || undefined)}
          className="text-sm h-8 rounded-full border px-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Todos os projetos</option>
          {projetos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>

        {/* Com prazo */}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filters.com_prazo}
            onChange={(e) => setFilter("com_prazo", e.target.checked)}
          />
          Com prazo
        </label>

        {/* Ordenação */}
        <select
          value={`${filters.order_by}:${filters.order_dir}`}
          onChange={(e) => {
            const [ob, od] = e.target.value.split(":") as ["criado_em" | "prazo" | "prioridade", "asc" | "desc"]
            setFilter("order_by", ob)
            setFilter("order_dir", od)
          }}
          className="text-sm h-8 rounded-full border px-3 bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="criado_em:desc">Mais recentes</option>
          <option value="criado_em:asc">Mais antigas</option>
          <option value="prazo:asc">Prazo (mais próximo)</option>
          <option value="prazo:desc">Prazo (mais distante)</option>
        </select>
      </div>

      {/* Estados */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar tarefas. Tente novamente.
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      )}

      {!isLoading && !isError && tarefas?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
          <Button onClick={handleNew} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Criar primeira tarefa
          </Button>
        </div>
      )}

      {!isLoading && !isError && tarefas && tarefas.length > 0 && (
        <div className="space-y-2">
          {tarefas.map((t) => (
            <TarefaCard key={t.id} tarefa={t} onClick={() => handleEdit(t)} />
          ))}
        </div>
      )}

      <TarefaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tarefa={tarefaSelecionada}
      />
    </div>
  )
}
