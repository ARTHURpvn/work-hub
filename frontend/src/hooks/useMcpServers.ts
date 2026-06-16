import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mcpApi, type McpInput } from "@/api/mcpServers"

const KEY = ["mcp-servers"] as const

export function useMcpServers() {
  return useQuery({ queryKey: KEY, queryFn: () => mcpApi.list() })
}

export function useMcpMutations() {
  const qc = useQueryClient()
  const inval = () => qc.invalidateQueries({ queryKey: KEY })
  return {
    create: useMutation({ mutationFn: (body: McpInput) => mcpApi.create(body), onSuccess: inval }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: McpInput }) => mcpApi.update(id, body),
      onSuccess: inval,
    }),
    remove: useMutation({ mutationFn: (id: string) => mcpApi.remove(id), onSuccess: inval }),
  }
}
