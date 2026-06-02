import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { calendarioApi, type TipoCalendario } from "@/api/calendario"

const KEY = ["calendario", "integracoes"] as const

export function useIntegracoes() {
  return useQuery({ queryKey: KEY, queryFn: () => calendarioApi.listIntegracoes() })
}

export function useIntegracaoMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: ({ tipo, credencial }: { tipo: TipoCalendario; credencial: Record<string, string> }) =>
        calendarioApi.createIntegracao(tipo, credencial),
      onSuccess: inval,
    }),
    setAtiva: useMutation({
      mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => calendarioApi.setAtiva(id, ativa),
      onSuccess: inval,
    }),
    remove: useMutation({
      mutationFn: (id: string) => calendarioApi.remove(id),
      onSuccess: inval,
    }),
    sync: useMutation({ mutationFn: () => calendarioApi.sync() }),
  }
}
