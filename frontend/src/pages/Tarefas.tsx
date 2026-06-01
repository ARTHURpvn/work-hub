import { ListTodo, Plus } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { FilterBar, FilterChip } from "@/components/common/FilterBar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TarefaCard } from "@/components/tarefas/TarefaCard"
import { TarefaModal } from "@/components/tarefas/TarefaModal"
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
    <div className="space-y-5">
      <PageHeader
        title="Tarefas"
        action={
          <Button onClick={handleNew} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nova tarefa
          </Button>
        }
      />

      <FilterBar>
        {STATUS_OPTS.map((opt) => (
          <FilterChip
            key={String(opt.value)}
            active={filters.status === opt.value}
            onClick={() => setFilter("status", opt.value)}
          >
            {opt.label}
          </FilterChip>
        ))}

        <Select
          value={filters.projeto_id ?? ""}
          onChange={(e) => setFilter("projeto_id", e.target.value || undefined)}
          className="h-9 w-auto"
        >
          <option value="">Todos os projetos</option>
          {projetos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </Select>

        <Checkbox
          id="com-prazo"
          label="Com prazo"
          checked={filters.com_prazo}
          onChange={(e) => setFilter("com_prazo", e.target.checked)}
        />

        <Select
          value={`${filters.order_by}:${filters.order_dir}`}
          onChange={(e) => {
            const [ob, od] = e.target.value.split(":") as ["criado_em" | "prazo" | "prioridade", "asc" | "desc"]
            setFilter("order_by", ob)
            setFilter("order_dir", od)
          }}
          className="h-9 w-auto"
        >
          <option value="criado_em:desc">Mais recentes</option>
          <option value="criado_em:asc">Mais antigas</option>
          <option value="prazo:asc">Prazo (mais próximo)</option>
          <option value="prazo:desc">Prazo (mais distante)</option>
        </Select>
      </FilterBar>

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
        <EmptyState
          icon={<ListTodo className="h-6 w-6" />}
          title="Nenhuma tarefa encontrada"
          description="Crie uma tarefa ou ajuste os filtros."
          action={
            <Button onClick={handleNew} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Criar primeira tarefa
            </Button>
          }
        />
      )}

      {!isLoading && !isError && tarefas && tarefas.length > 0 && (
        <div className="space-y-2">
          {tarefas.map((t) => (
            <TarefaCard key={t.id} tarefa={t} onClick={() => handleEdit(t)} />
          ))}
        </div>
      )}

      <TarefaModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tarefa={tarefaSelecionada}
      />
    </div>
  )
}
