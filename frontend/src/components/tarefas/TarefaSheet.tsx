import { useEffect, useState } from "react"
import { DetailSheet, type DetailMode } from "@/components/common/DetailSheet"
import { TarefaForm } from "./TarefaForm"
import { TarefaView } from "./TarefaView"
import type { Tarefa } from "@/api/tarefas"

interface Props {
  open: boolean
  onClose: () => void
  /** undefined = nova tarefa */
  tarefa?: Tarefa
}

export function TarefaSheet({ open, onClose, tarefa }: Props) {
  const isNew = !tarefa
  const [mode, setMode] = useState<DetailMode>(isNew ? "edit" : "view")

  useEffect(() => {
    setMode(isNew ? "edit" : "view")
  }, [tarefa?.id, open, isNew])

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={isNew ? "Nova tarefa" : (tarefa?.titulo ?? "Tarefa")}
      mode={mode}
      onEdit={() => setMode("edit")}
      showEditButton={!isNew}
    >
      {mode === "view" && tarefa ? (
        <TarefaView tarefa={tarefa} />
      ) : (
        <TarefaForm
          tarefa={tarefa}
          onSaved={() => (isNew ? onClose() : setMode("view"))}
          onCancel={() => (isNew ? onClose() : setMode("view"))}
        />
      )}
    </DetailSheet>
  )
}
