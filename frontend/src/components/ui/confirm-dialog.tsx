import { Modal } from "./Modal"
import { Button } from "./kit"
import { useConfirmStore } from "@/store/confirmStore"

/** Renderiza o diálogo de confirmação controlado pelo confirmStore. Montar uma vez na raiz. */
export function ConfirmRoot() {
  const { options, close } = useConfirmStore()
  if (!options) return null

  return (
    <Modal
      onClose={() => close(false)}
      title={options.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            {options.cancelLabel ?? "Cancelar"}
          </Button>
          <Button variant={options.destructive ? "danger" : "primary"} onClick={() => close(true)}>
            {options.confirmLabel ?? "Confirmar"}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: "var(--text-2)", lineHeight: 1.55 }}>{options.description}</p>
    </Modal>
  )
}
