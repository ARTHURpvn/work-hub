import { useEffect, useState } from "react"
import { DetailSheet, type DetailMode } from "@/components/common/DetailSheet"
import { ProjetoForm } from "./ProjetoForm"
import { ProjetoView } from "./ProjetoView"
import type { Projeto } from "@/api/projetos"

interface Props {
  open: boolean
  onClose: () => void
  /** undefined = criar novo projeto */
  projeto?: Projeto
}

export function ProjetoSheet({ open, onClose, projeto }: Props) {
  const isNew = !projeto
  const [mode, setMode] = useState<DetailMode>(isNew ? "edit" : "view")

  // Sempre reabrir em modo leitura (ou edição, se for novo) ao trocar de alvo.
  useEffect(() => {
    setMode(isNew ? "edit" : "view")
  }, [projeto?.id, open, isNew])

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={isNew ? "Novo projeto" : (projeto?.nome ?? "Projeto")}
      mode={mode}
      onEdit={() => setMode("edit")}
      showEditButton={!isNew}
    >
      {mode === "view" && projeto ? (
        <ProjetoView projeto={projeto} />
      ) : (
        <ProjetoForm
          projeto={projeto}
          onSaved={() => (isNew ? onClose() : setMode("view"))}
          onCancel={() => (isNew ? onClose() : setMode("view"))}
        />
      )}
    </DetailSheet>
  )
}
