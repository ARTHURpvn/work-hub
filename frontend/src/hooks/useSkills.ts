import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { skillsApi, type SkillArquivo } from "@/api/skills"

const KEY = ["skills"] as const

export function useSkills() {
  return useQuery({ queryKey: KEY, queryFn: () => skillsApi.list() })
}

export function useSkillChat(id: string | undefined) {
  return useQuery({
    queryKey: ["skill-chat", id],
    queryFn: () => skillsApi.getChat(id!),
    enabled: !!id,
  })
}

export function useSkillMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({
      mutationFn: (body: { display_title: string; conteudo: string; arquivos?: SkillArquivo[] }) =>
        skillsApi.create(body),
      onSuccess: inval,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        conteudo,
        display_title,
        arquivos,
      }: {
        id: string
        conteudo: string
        display_title?: string
        arquivos?: SkillArquivo[]
      }) => skillsApi.update(id, { conteudo, display_title, arquivos }),
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
      mutationFn: ({ id, mensagem }: { id: string; mensagem: string }) => skillsApi.chat(id, mensagem),
    }),
    clearChat: useMutation({
      mutationFn: (id: string) => skillsApi.clearChat(id),
    }),
    assistente: useMutation({
      mutationFn: (mensagens: { role: "user" | "assistant"; content: string }[]) => skillsApi.assistente(mensagens),
    }),
  }
}
