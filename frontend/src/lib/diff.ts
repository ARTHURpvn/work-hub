/** Diff simples por linha (conjunto): linhas presentes só no novo (add) ou só no atual (del). */
export function diffLinhas(
  atual: string,
  novo: string,
  max = 14,
): { add: string[]; del: string[] } {
  const a = new Set(atual.split("\n"))
  const b = new Set(novo.split("\n"))
  return {
    add: novo.split("\n").filter((l) => l.trim() && !a.has(l)).slice(0, max),
    del: atual.split("\n").filter((l) => l.trim() && !b.has(l)).slice(0, max),
  }
}
