import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { hooksApi, type HookInput } from "@/api/hooks"

const KEY = ["hooks"] as const

export function useHooks() {
  return useQuery({ queryKey: KEY, queryFn: () => hooksApi.list() })
}

export function useHookMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: HookInput) => hooksApi.create(body), onSuccess: inval }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: HookInput }) => hooksApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({ mutationFn: (id: string) => hooksApi.remove(id), onSuccess: inval }),
  }
}
