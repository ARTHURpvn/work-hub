import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pluginsApi, type PluginInput } from "@/api/plugins"

const KEY = ["plugins"] as const

export function usePlugins() {
  return useQuery({ queryKey: KEY, queryFn: () => pluginsApi.list() })
}

export function usePluginMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: PluginInput) => pluginsApi.create(body),
      onSuccess: inval,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: PluginInput }) => pluginsApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({
      mutationFn: (id: string) => pluginsApi.remove(id),
      onSuccess: inval,
    }),
    exportar: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => pluginsApi.export(id, name),
    }),
  }
}
