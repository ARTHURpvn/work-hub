import { create } from "zustand"
import type { Status } from "@/api/tarefas"

interface TarefaFilters {
  status: Status | undefined
  projeto_id: string | undefined
  com_prazo: boolean
  order_by: "criado_em" | "prazo" | "prioridade"
  order_dir: "asc" | "desc"
}

interface TarefaStore {
  filters: TarefaFilters
  setFilter: <K extends keyof TarefaFilters>(key: K, value: TarefaFilters[K]) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: TarefaFilters = {
  status: undefined,
  projeto_id: undefined,
  com_prazo: false,
  order_by: "criado_em",
  order_dir: "desc",
}

export const useTarefaStore = create<TarefaStore>((set) => ({
  filters: DEFAULT_FILTERS,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}))
