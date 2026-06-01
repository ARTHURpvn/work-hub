import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { projetosApi, type Origem, type ProjetoCreate, type ProjetoUpdate } from "@/api/projetos"

const KEYS = {
  all: ["projetos"] as const,
  list: (origem?: Origem, arquivado?: boolean) =>
    ["projetos", "list", origem, arquivado] as const,
}

export function useProjetos(params?: { origem?: Origem; arquivado?: boolean }) {
  return useQuery({
    queryKey: KEYS.list(params?.origem, params?.arquivado),
    queryFn: () => projetosApi.list(params),
  })
}

export function useCreateProjeto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ProjetoCreate) => projetosApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateProjeto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjetoUpdate }) =>
      projetosApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useAddMembro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nome, contato }: { id: string; nome: string; contato?: string }) =>
      projetosApi.addMembro(id, { nome, contato }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useRemoveMembro() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ projetoId, membroId }: { projetoId: string; membroId: string }) =>
      projetosApi.removeMembro(projetoId, membroId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
