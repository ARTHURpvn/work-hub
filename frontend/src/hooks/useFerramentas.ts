import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ferramentasApi, type FerramentaInput } from "@/api/ferramentas"

const KEY = ["ferramentas"] as const

export function useFerramentas() {
  return useQuery({ queryKey: KEY, queryFn: () => ferramentasApi.list() })
}

export function useFerramentaMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: FerramentaInput) => ferramentasApi.create(body), onSuccess: inval }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: FerramentaInput }) => ferramentasApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({ mutationFn: (id: string) => ferramentasApi.remove(id), onSuccess: inval }),
  }
}
