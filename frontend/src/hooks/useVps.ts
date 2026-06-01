import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { vpsApi, type VpsCreate, type VpsUpdate } from "@/api/vps"

const KEY = ["vps"] as const

export function useVpsList() {
  return useQuery({ queryKey: KEY, queryFn: () => vpsApi.list() })
}

export function useCreateVps() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: VpsCreate) => vpsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useUpdateVps() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VpsUpdate }) => vpsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

export function useDeleteVps() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => vpsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ["projetos"] })
      qc.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}
