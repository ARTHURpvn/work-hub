import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { configApi, type ConfigItem } from "@/api/config"

const KEY = ["config"] as const

export function useConfig() {
  return useQuery({ queryKey: KEY, queryFn: () => configApi.list() })
}

export function useConfigMutations() {
  const qc = useQueryClient()
  const apply = (itens: ConfigItem[]) => qc.setQueryData(KEY, itens)
  return {
    set: useMutation({
      mutationFn: ({ chave, valor }: { chave: string; valor: string }) => configApi.set(chave, valor),
      onSuccess: apply,
    }),
    remove: useMutation({
      mutationFn: (chave: string) => configApi.remove(chave),
      onSuccess: apply,
    }),
  }
}
