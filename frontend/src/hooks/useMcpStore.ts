import { useMutation, useQuery } from "@tanstack/react-query"
import { mcpStoreApi } from "@/api/mcpStore"

export function useMcpStoreSearch(q: string, enabled: boolean) {
  return useQuery({
    queryKey: ["mcp-store", q],
    queryFn: () => mcpStoreApi.search(q),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMcpImport() {
  return useMutation({
    mutationFn: ({ name, nameLocal }: { name: string; nameLocal?: string }) =>
      mcpStoreApi.import(name, nameLocal),
  })
}
