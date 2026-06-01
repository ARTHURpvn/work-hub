import { FolderOpen, Plus } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { FilterBar, FilterChip } from "@/components/common/FilterBar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjetoCard } from "@/components/projetos/ProjetoCard"
import { ProjetoSheet } from "@/components/projetos/ProjetoSheet"
import { useProjetos } from "@/hooks/useProjetos"
import type { Origem, Projeto } from "@/api/projetos"

const ORIGENS: Origem[] = ["Otavio", "Titan", "Freelas", "Pessoal"]

export function Projetos() {
  const [origemFiltro, setOrigemFiltro] = useState<Origem | undefined>()
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionadoId, setSelecionadoId] = useState<string | undefined>()

  const { data: projetos, isLoading, isError } = useProjetos({
    origem: origemFiltro,
    arquivado: mostrarArquivados ? undefined : false,
  })

  // Deriva da lista (por ID) para refletir atualizações após salvar.
  const projetoSelecionado: Projeto | undefined = selecionadoId
    ? projetos?.find((p) => p.id === selecionadoId)
    : undefined

  function handleEdit(p: Projeto) {
    setSelecionadoId(p.id)
    setSheetOpen(true)
  }

  function handleNew() {
    setSelecionadoId(undefined)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projetos"
        action={
          <Button onClick={handleNew} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Novo projeto
          </Button>
        }
      />

      <FilterBar>
        <FilterChip active={!origemFiltro} onClick={() => setOrigemFiltro(undefined)}>
          Todos
        </FilterChip>
        {ORIGENS.map((o) => (
          <FilterChip
            key={o}
            active={origemFiltro === o}
            onClick={() => setOrigemFiltro(origemFiltro === o ? undefined : o)}
          >
            {o}
          </FilterChip>
        ))}
        <Checkbox
          id="arquivados"
          label="Mostrar arquivados"
          className="ml-2"
          checked={mostrarArquivados}
          onChange={(e) => setMostrarArquivados(e.target.checked)}
        />
      </FilterBar>

      {/* Estados */}
      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar projetos. Tente novamente.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !isError && projetos?.length === 0 && (
        <EmptyState
          icon={<FolderOpen className="h-6 w-6" />}
          title="Nenhum projeto encontrado"
          description="Crie seu primeiro projeto para começar a organizar o trabalho."
          action={
            <Button onClick={handleNew} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Criar primeiro projeto
            </Button>
          }
        />
      )}

      {!isLoading && !isError && projetos && projetos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => (
            <ProjetoCard key={p.id} projeto={p} onClick={() => handleEdit(p)} />
          ))}
        </div>
      )}

      <ProjetoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        projeto={projetoSelecionado}
      />
    </div>
  )
}
