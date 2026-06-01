import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projetosApi } from "@/api/projetos"

export function useUpsertCredencial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, usuario, senha }: { id: string; usuario: string; senha: string }) =>
      projetosApi.upsertCredencial(id, { usuario, senha }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos"] }),
  })
}

export function useDeleteCredencial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projetosApi.removeCredencial(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projetos"] }),
  })
}
