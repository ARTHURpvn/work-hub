import { useEffect, useState } from "react"
import { DetailSheet, type DetailMode } from "@/components/common/DetailSheet"
import { VpsForm } from "./VpsForm"
import { VpsView } from "./VpsView"
import type { VpsComProjetos } from "@/api/vps"

interface Props {
  open: boolean
  onClose: () => void
  /** undefined = cadastrar nova VPS */
  vps?: VpsComProjetos
}

export function VpsSheet({ open, onClose, vps }: Props) {
  const isNew = !vps
  const [mode, setMode] = useState<DetailMode>(isNew ? "edit" : "view")

  useEffect(() => {
    setMode(isNew ? "edit" : "view")
  }, [vps?.id, open, isNew])

  return (
    <DetailSheet
      open={open}
      onClose={onClose}
      title={isNew ? "Nova VPS" : (vps?.nome ?? vps?.ip ?? "VPS")}
      mode={mode}
      onEdit={() => setMode("edit")}
      showEditButton={!isNew}
    >
      {mode === "view" && vps ? (
        <VpsView vps={vps} />
      ) : (
        <VpsForm
          vps={vps}
          onSaved={() => (isNew ? onClose() : setMode("view"))}
          onCancel={() => (isNew ? onClose() : setMode("view"))}
          onDeleted={onClose}
        />
      )}
    </DetailSheet>
  )
}
