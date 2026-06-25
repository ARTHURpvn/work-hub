import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { donosApi } from "@/api/donos"

const KEY = ["donos"] as const

export function useDonos() {
  return useQuery({ queryKey: KEY, queryFn: () => donosApi.list() })
}

export function useDonoMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (nome: string) => donosApi.create(nome), onSuccess: inval }),
    remove: useMutation({ mutationFn: (id: string) => donosApi.remove(id), onSuccess: inval }),
  }
}
