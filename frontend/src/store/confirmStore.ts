import { create } from "zustand"

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmStore {
  options: ConfirmOptions | null
  _resolve?: (value: boolean) => void
  open: (options: ConfirmOptions) => Promise<boolean>
  close: (value: boolean) => void
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  options: null,
  open: (options) =>
    new Promise<boolean>((resolve) => {
      set({ options, _resolve: resolve })
    }),
  close: (value) => {
    get()._resolve?.(value)
    set({ options: null, _resolve: undefined })
  },
}))

/** Helper imperativo: `if (await confirm({ title, destructive: true })) { ... }`. */
export const confirm = (options: ConfirmOptions) => useConfirmStore.getState().open(options)
