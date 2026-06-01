import { Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjetoCard } from "@/components/projetos/ProjetoCard"
import { ProjetoSheet } from "@/components/projetos/ProjetoSheet"
import { useProjetos } from "@/hooks/useProjetos"
import type { Origem, Projeto } from "@/api/projetos"

const ORIGENS: Origem[] = ["Otavio", "Titan", "Freelas"]

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Projetos</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo projeto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOrigemFiltro(undefined)}
          className={`text-sm px-3 py-1 rounded-full border transition-colors ${!origemFiltro ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          Todos
        </button>
        {ORIGENS.map((o) => (
          <button
            key={o}
            onClick={() => setOrigemFiltro(origemFiltro === o ? undefined : o)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${origemFiltro === o ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            {o}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer ml-2">
          <input
            type="checkbox"
            checked={mostrarArquivados}
            onChange={(e) => setMostrarArquivados(e.target.checked)}
          />
          Mostrar arquivados
        </label>
      </div>

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
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
          <Button onClick={handleNew} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Criar primeiro projeto
          </Button>
        </div>
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
