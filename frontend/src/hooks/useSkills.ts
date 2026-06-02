import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { skillsApi, type ChatMensagem, type SkillOrigem } from "@/api/skills"

const KEY = ["skills"] as const

export function useSkills() {
  return useQuery({ queryKey: KEY, queryFn: () => skillsApi.list() })
}

export function useSkillMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: { slug: string; name: string; description: string }) => skillsApi.create(body),
      onSuccess: inval,
    }),
    update: useMutation({
      mutationFn: ({ slug, conteudo }: { slug: string; conteudo: string }) => skillsApi.update(slug, conteudo),
      onSuccess: inval,
    }),
    remove: useMutation({
      mutationFn: (slug: string) => skillsApi.remove(slug),
      onSuccess: inval,
    }),
    melhorar: useMutation({
      mutationFn: (slug: string) => skillsApi.melhorar(slug),
    }),
    chat: useMutation({
      mutationFn: ({ slug, mensagens }: { slug: string; mensagens: ChatMensagem[] }) =>
        skillsApi.chat(slug, mensagens),
    }),
    importar: useMutation({
      mutationFn: ({ origem, slug }: { origem: SkillOrigem; slug: string }) =>
        skillsApi.importar(origem, slug),
      onSuccess: inval,
    }),
  }
}
