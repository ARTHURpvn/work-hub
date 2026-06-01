import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useConfirmStore } from "@/store/confirmStore"

/** Renderiza o diálogo de confirmação controlado pelo confirmStore. Montar uma vez na raiz. */
export function ConfirmRoot() {
  const { options, close } = useConfirmStore()

  useEffect(() => {
    if (!options) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [options, close])

  if (!options) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => close(false)} aria-hidden />
      <div role="dialog" aria-modal className="relative z-10 w-full max-w-sm rounded-lg border bg-popover p-5 shadow-xl">
        <h2 className="text-base font-semibold">{options.title}</h2>
        {options.description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{options.description}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => close(false)} autoFocus>
            {options.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            variant={options.destructive ? "destructive" : "default"}
            size="sm"
            onClick={() => close(true)}
          >
            {options.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
