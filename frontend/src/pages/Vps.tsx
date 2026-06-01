import { Plus, Server } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { VpsSheet } from "@/components/vps/VpsSheet"
import { useVpsList } from "@/hooks/useVps"
import type { VpsComProjetos } from "@/api/vps"

export function Vps() {
  const { data: vpsList, isLoading, isError } = useVpsList()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selecionadaId, setSelecionadaId] = useState<string | undefined>()

  const selecionada: VpsComProjetos | undefined = selecionadaId
    ? vpsList?.find((v) => v.id === selecionadaId)
    : undefined

  function handleOpen(v: VpsComProjetos) {
    setSelecionadaId(v.id)
    setSheetOpen(true)
  }

  function handleNew() {
    setSelecionadaId(undefined)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">VPS</h1>
        <Button onClick={handleNew} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Nova VPS
        </Button>
      </div>

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar VPS.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !isError && vpsList?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground">Nenhuma VPS cadastrada.</p>
          <Button onClick={handleNew} variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Cadastrar primeira VPS
          </Button>
        </div>
      )}

      {!isLoading && !isError && vpsList && vpsList.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vpsList.map((v) => (
            <button
              key={v.id}
              onClick={() => handleOpen(v)}
              className="w-full rounded-lg border bg-background p-4 text-left shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{v.nome ?? v.ip}</span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{v.ip}</p>
              {v.provedor && <p className="text-xs text-muted-foreground">{v.provedor}</p>}
              <p className="mt-2 text-xs text-muted-foreground">
                {v.projetos.length} projeto{v.projetos.length !== 1 ? "s" : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      <VpsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} vps={selecionada} />
    </div>
  )
}
