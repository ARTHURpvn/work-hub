import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Empty, OriginTag } from "@/components/ui/kit"
import { useProjeto } from "@/hooks/useProjetos"
import { ProjetoView } from "./ProjetoView"

/** Abre um projeto (por id) num Modal read-only — usado no popup do VPS. */
export function ProjetoViewModal({ projetoId, onClose }: { projetoId: string; onClose: () => void }) {
  const { data: projeto, isLoading } = useProjeto(projetoId)

  const head = projeto ? (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <OriginTag origin={projeto.origem} />
      <span style={{ fontWeight: 700, fontSize: 15 }} className="truncate">
        {projeto.nome}
      </span>
      {projeto.rascunho && (
        <span className="chip static">
          <Icon name="sparkle" size={12} /> Ideia
        </span>
      )}
    </div>
  ) : (
    "Projeto"
  )

  return (
    <Modal title={head} onClose={onClose} size="lg">
      {isLoading && !projeto && <p className="muted">Carregando…</p>}
      {!isLoading && !projeto && <Empty icon="folder" title="Projeto não encontrado" />}
      {projeto && <ProjetoView projeto={projeto} />}
    </Modal>
  )
}
