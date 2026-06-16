import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { subagentsApi, type SubagentInput } from "@/api/subagents"

const KEY = ["subagents"] as const

export function useSubagents() {
  return useQuery({ queryKey: KEY, queryFn: () => subagentsApi.list() })
}

export function useSubagentMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: SubagentInput) => subagentsApi.create(body),
      onSuccess: inval,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: SubagentInput }) => subagentsApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({
      mutationFn: (id: string) => subagentsApi.remove(id),
      onSuccess: inval,
    }),
    melhorar: useMutation({
      mutationFn: (id: string) => subagentsApi.melhorar(id),
    }),
  }
}
