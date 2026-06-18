import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query"
import { mcpStoreApi } from "@/api/mcpStore"

export function useMcpStoreSearch(q: string) {
  return useInfiniteQuery({
    queryKey: ["mcp-store", q],
    queryFn: ({ pageParam }) => mcpStoreApi.search(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMcpDocs(kind: string | null, id: string | null) {
  return useQuery({
    queryKey: ["mcp-store-docs", kind, id],
    queryFn: () => mcpStoreApi.docs(kind!, id!),
    enabled: !!kind && !!id && (kind === "npm" || kind === "pypi"),
    staleTime: 10 * 60 * 1000,
  })
}

export function useMcpImport() {
  return useMutation({
    mutationFn: ({ name, nameLocal }: { name: string; nameLocal?: string }) =>
      mcpStoreApi.import(name, nameLocal),
  })
}
