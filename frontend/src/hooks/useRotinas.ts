import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rotinasApi, type RotinaCreate, type RotinaUpdate } from "@/api/rotinas"

const KEY = ["rotinas"] as const

export function useRotinas() {
  return useQuery({ queryKey: KEY, queryFn: () => rotinasApi.list() })
}

export function useRotinaMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: RotinaCreate) => rotinasApi.create(body), onSuccess: inval }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: RotinaUpdate }) => rotinasApi.update(id, data),
      onSuccess: inval,
    }),
    remove: useMutation({ mutationFn: (id: string) => rotinasApi.remove(id), onSuccess: inval }),
  }
}
