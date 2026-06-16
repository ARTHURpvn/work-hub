import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { commandsApi, type CommandInput } from "@/api/commands"

const KEY = ["commands"] as const

export function useCommands() {
  return useQuery({ queryKey: KEY, queryFn: () => commandsApi.list() })
}

export function useCommandMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: CommandInput) => commandsApi.create(body), onSuccess: inval }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: CommandInput }) => commandsApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({ mutationFn: (id: string) => commandsApi.remove(id), onSuccess: inval }),
  }
}
