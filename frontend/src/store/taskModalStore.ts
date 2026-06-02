import { create } from "zustand"

interface TaskModalStore {
  taskId: string | null
  open: (id: string) => void
  close: () => void
}

/** Controla o modal central de tarefa, abrível de qualquer tela. */
export const useTaskModalStore = create<TaskModalStore>((set) => ({
  taskId: null,
  open: (id) => set({ taskId: id }),
  close: () => set({ taskId: null }),
}))
