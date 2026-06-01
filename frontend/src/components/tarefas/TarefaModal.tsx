import { Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { LinksBox } from "./LinksBox"
import { SubtarefasBox } from "./SubtarefasBox"
import { TarefaForm } from "./TarefaForm"
import { TarefaView } from "./TarefaView"
import type { Tarefa } from "@/api/tarefas"

interface Props {
  open: boolean
  onClose: () => void
  /** undefined = nova tarefa */
  tarefa?: Tarefa
  /** Pré-seleciona o projeto ao criar uma tarefa nova. */
  projetoIdInicial?: string
}

export function TarefaModal({ open, onClose, tarefa, projetoIdInicial }: Props) {
  const isNew = !tarefa
  const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view")

  useEffect(() => {
    setMode(isNew ? "edit" : "view")
  }, [tarefa?.id, open, isNew])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isNew ? "Nova tarefa" : (tarefa?.titulo ?? "Tarefa")}
      headerAction={
        mode === "view" && !isNew ? (
          <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
          </Button>
        ) : undefined
      }
    >
      {mode === "view" && tarefa ? (
        <div className="space-y-6">
          <TarefaView tarefa={tarefa} />
          <div className="border-t pt-4">
            <SubtarefasBox tarefaId={tarefa.id} subtarefas={tarefa.subtarefas} />
          </div>
          <div className="border-t pt-4">
            <LinksBox tarefaId={tarefa.id} links={tarefa.links} />
          </div>
        </div>
      ) : (
        <TarefaForm
          tarefa={tarefa}
          projetoIdInicial={projetoIdInicial}
          onSaved={() => (isNew ? onClose() : setMode("view"))}
          onCancel={() => (isNew ? onClose() : setMode("view"))}
        />
      )}
    </Dialog>
  )
}
