import { Plus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TarefaModal } from "@/components/tarefas/TarefaModal"
import { useTarefas } from "@/hooks/useTarefas"

const STATUS_DOT: Record<string, string> = {
  "A Fazer": "bg-slate-400",
  "Em Andamento": "bg-sky-400",
  "Em Revisao": "bg-amber-400",
  Concluido: "bg-emerald-400",
}

export function ProjetoTarefas({ projetoId }: { projetoId: string }) {
  const { data: tarefas } = useTarefas({ projeto_id: projetoId })
  const [open, setOpen] = useState(false)
  const [selId, setSelId] = useState<string | undefined>()
  const [nova, setNova] = useState(false)

  const sel = selId ? tarefas?.find((t) => t.id === selId) : undefined

  function abrirNova() {
    setNova(true)
    setSelId(undefined)
    setOpen(true)
  }
  function abrir(id: string) {
    setNova(false)
    setSelId(id)
    setOpen(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Tarefas ({tarefas?.length ?? 0})</p>
        <Button size="sm" variant="outline" onClick={abrirNova}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova
        </Button>
      </div>

      {!tarefas || tarefas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma tarefa neste projeto.</p>
      ) : (
        <ul className="space-y-1">
          {tarefas.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => abrir(t.id)}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[t.status] ?? "bg-muted"}`} />
                <span className={`flex-1 truncate ${t.status === "Concluido" ? "text-muted-foreground line-through" : ""}`}>
                  {t.titulo}
                </span>
                {t.subtarefas.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t.subtarefas.filter((s) => s.concluida).length}/{t.subtarefas.length}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <TarefaModal
        open={open}
        onClose={() => setOpen(false)}
        tarefa={nova ? undefined : sel}
        projetoIdInicial={nova ? projetoId : undefined}
      />
    </div>
  )
}
