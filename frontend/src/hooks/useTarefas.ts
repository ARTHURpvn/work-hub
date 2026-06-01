import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tarefasApi, type Status, type TarefaCreate, type TarefaListParams, type TarefaUpdate, type Tarefa } from "@/api/tarefas"

const KEYS = {
  all: ["tarefas"] as const,
  list: (params?: TarefaListParams) => ["tarefas", "list", params] as const,
}

export function useTarefas(params?: TarefaListParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => tarefasApi.list(params),
  })
}

export function useCreateTarefa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TarefaCreate) => tarefasApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateTarefa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TarefaUpdate }) =>
      tarefasApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteTarefa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tarefasApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

// Usado pelo Kanban — update otimista
export function useUpdateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      tarefasApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: KEYS.all })
      const snapshots = qc.getQueriesData<Tarefa[]>({ queryKey: KEYS.all })

      qc.setQueriesData<Tarefa[]>({ queryKey: KEYS.all }, (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      )
      return { snapshots }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          qc.setQueryData(key, data)
        }
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
