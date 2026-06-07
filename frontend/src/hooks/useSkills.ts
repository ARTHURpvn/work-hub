import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { skillsApi, type ChatMensagem } from "@/api/skills"

const KEY = ["skills"] as const

export function useSkills() {
  return useQuery({ queryKey: KEY, queryFn: () => skillsApi.list() })
}

export function useSkillMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: { display_title: string; conteudo: string }) => skillsApi.create(body),
      onSuccess: inval,
    }),
    update: useMutation({
      mutationFn: ({ id, conteudo, display_title }: { id: string; conteudo: string; display_title?: string }) =>
        skillsApi.update(id, { conteudo, display_title }),
      onSuccess: inval,
    }),
    remove: useMutation({
      mutationFn: (id: string) => skillsApi.remove(id),
      onSuccess: inval,
    }),
    migrar: useMutation({
      mutationFn: () => skillsApi.migrar(),
      onSuccess: inval,
    }),
    chat: useMutation({
      mutationFn: ({ id, mensagens }: { id: string; mensagens: ChatMensagem[] }) => skillsApi.chat(id, mensagens),
    }),
  }
}
