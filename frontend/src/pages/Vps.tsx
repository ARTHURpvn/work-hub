import { Plus, Server } from "lucide-react"
import { useState } from "react"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
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
    <div className="space-y-5">
      <PageHeader
        title="VPS"
        description="Servidores e os projetos hospedados em cada um."
        action={
          <Button onClick={handleNew} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nova VPS
          </Button>
        }
      />

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
        <EmptyState
          icon={<Server className="h-6 w-6" />}
          title="Nenhuma VPS cadastrada"
          description="Cadastre uma VPS para depois vincular projetos a ela."
          action={
            <Button onClick={handleNew} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Cadastrar primeira VPS
            </Button>
          }
        />
      )}

      {!isLoading && !isError && vpsList && vpsList.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vpsList.map((v) => (
            <button
              key={v.id}
              onClick={() => handleOpen(v)}
              className="w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
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
