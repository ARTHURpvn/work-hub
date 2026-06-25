import type { Origem } from "@/api/projetos"
import type { Status, Tarefa } from "@/api/tarefas"

/* ---------- Origem (dono do projeto) ---------- */
export interface OrigemMeta {
  id: Origem
  label: string
  cls: string
}

export const ORIGENS: OrigemMeta[] = [
  { id: "Otavio", label: "Otavio", cls: "tag-otavio" },
  { id: "Titan", label: "Titan", cls: "tag-titan" },
  { id: "Freelas", label: "Freelas", cls: "tag-free" },
  { id: "Pessoal", label: "Pessoal", cls: "tag-pess" },
]

export function origemMeta(id: string | null | undefined): OrigemMeta {
  const found = ORIGENS.find((o) => o.id === id)
  if (found) return found
  // dono dinâmico (criado pelo usuário): usa o próprio nome + cor neutra
  return { id: (id || "—") as Origem, label: id || "—", cls: "tag-pess" }
}

/* ---------- Status (tarefa) ---------- */
export interface StatusMeta {
  id: Status
  label: string
  cls: string
  kdot: string
}

export const STATUSES: StatusMeta[] = [
  { id: "A Fazer", label: "A Fazer", cls: "pill-todo", kdot: "var(--muted)" },
  { id: "Em Andamento", label: "Em Andamento", cls: "pill-doing", kdot: "var(--info)" },
  { id: "Em Revisao", label: "Em Revisão", cls: "pill-review", kdot: "var(--warn)" },
  { id: "Concluido", label: "Concluído", cls: "pill-done", kdot: "var(--ok)" },
]

export function statusMeta(id: string | null | undefined): StatusMeta {
  return STATUSES.find((s) => s.id === id) ?? STATUSES[0]
}

/* ---------- Datas (parsing local, sem fuso) ---------- */
export function parseISO(s: string | null | undefined): Date | null {
  if (!s) return null
  const [y, m, d] = s.slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function fmtDate(s: string | null | undefined): string {
  const d = parseISO(s)
  return d ? d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"
}

export function fmtLong(s: string | null | undefined): string {
  const d = parseISO(s)
  return d ? d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function daysUntil(s: string | null | undefined): number | null {
  const d = parseISO(s)
  if (!d) return null
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - t.getTime()) / 86400000)
}

export interface DueLabel {
  txt: string
  tone: "" | "late" | "soon"
}

export function dueLabel(s: string | null | undefined): DueLabel {
  const n = daysUntil(s)
  if (n === null) return { txt: "—", tone: "" }
  if (n < 0) return { txt: `${Math.abs(n)}d atrás`, tone: "late" }
  if (n === 0) return { txt: "hoje", tone: "soon" }
  if (n === 1) return { txt: "amanhã", tone: "soon" }
  if (n <= 7) return { txt: `${n}d`, tone: "soon" }
  return { txt: fmtDate(s), tone: "" }
}

/* ---------- Derivados de tarefa ---------- */
export function isLate(t: Pick<Tarefa, "status" | "prazo">): boolean {
  if (t.status === "Concluido" || !t.prazo) return false
  const n = daysUntil(t.prazo)
  return n !== null && n < 0
}

export interface SubProgress {
  pct: number
  total: number
  done: number
}

export function subProgress(t: Pick<Tarefa, "subtarefas">): SubProgress {
  const subs = t.subtarefas ?? []
  if (!subs.length) return { pct: 0, total: 0, done: 0 }
  const done = subs.filter((s) => s.concluida).length
  return { pct: Math.round((done / subs.length) * 100), total: subs.length, done }
}

/* ---------- Util ---------- */
export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "")
  } catch {
    return url
  }
}
