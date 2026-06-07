import { useQuery } from "@tanstack/react-query"
import { usoApi } from "@/api/uso"

export function useUso() {
  return useQuery({
    queryKey: ["uso"],
    queryFn: () => usoApi.resumo(),
    staleTime: 60_000,
  })
}

export function useUsoClaudeCode() {
  return useQuery({
    queryKey: ["uso", "claude-code"],
    queryFn: () => usoApi.claudeCode(),
    staleTime: 60_000,
  })
}
