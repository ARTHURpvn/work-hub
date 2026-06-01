import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useSubtarefas } from "@/hooks/useTarefas"
import type { Subtarefa } from "@/api/tarefas"

interface Props {
  tarefaId: string
  subtarefas: Subtarefa[]
}

export function SubtarefasBox({ tarefaId, subtarefas }: Props) {
  const { add, update, remove } = useSubtarefas()
  const [titulo, setTitulo] = useState("")

  const total = subtarefas.length
  const feitas = subtarefas.filter((s) => s.concluida).length
  const pct = total ? Math.round((feitas / total) * 100) : 0

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    add.mutate({ tarefaId, titulo: titulo.trim() }, { onSuccess: () => setTitulo("") })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Subtarefas {total > 0 && `· ${feitas}/${total}`}
        </p>
        {total > 0 && <span className="text-xs text-muted-foreground">{pct}%</span>}
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <ul className="space-y-1">
        {subtarefas.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 text-sm">
            <Checkbox
              checked={s.concluida}
              onChange={(e) => update.mutate({ tarefaId, subId: s.id, data: { concluida: e.target.checked } })}
            />
            <span className={s.concluida ? "flex-1 text-muted-foreground line-through" : "flex-1"}>
              {s.titulo}
            </span>
            <button
              onClick={() => remove.mutate({ tarefaId, subId: s.id })}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Remover subtarefa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Adicionar subtarefa"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={add.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
