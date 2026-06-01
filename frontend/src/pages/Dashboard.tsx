import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FolderOpen,
  GitBranch,
  Globe,
  ListTodo,
  Server,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"

type Tone = "primary" | "muted" | "warning" | "danger" | "success"

const toneText: Record<Tone, string> = {
  primary: "text-primary",
  muted: "text-foreground",
  warning: "text-amber-400",
  danger: "text-destructive",
  success: "text-emerald-400",
}

function Kpi({ label, value, sub, icon, tone = "muted" }: { label: string; value: number; sub?: string; icon: ReactNode; tone?: Tone }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className={`text-3xl font-bold tabular-nums ${toneText[tone]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

const STATUS_BAR: Record<string, string> = {
  "A Fazer": "bg-slate-400",
  "Em Andamento": "bg-sky-400",
  "Em Revisao": "bg-amber-400",
  Concluido: "bg-emerald-400",
}

function formatPrazo(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function Dashboard() {
  const { data, isLoading, isError } = useDashboard()

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        Erro ao carregar o dashboard.
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-lg" />
          <Skeleton className="h-56 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  const { projetos, tarefas, tarefas_atencao, projetos_progresso, repositorios_por_vps } = data
  const concluidas = tarefas.por_status["Concluido"] ?? 0
  const abertas = tarefas.total - concluidas
  const totalStatus = tarefas.total || 1

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral dos seus projetos, tarefas e infraestrutura." />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Projetos ativos" value={projetos.ativos} sub={`${projetos.com_vps} com VPS · ${projetos.com_autenticacao} com login`} icon={<FolderOpen className="h-4 w-4" />} tone="primary" />
        <Kpi label="Tarefas abertas" value={abertas} sub={`${concluidas} concluídas`} icon={<ListTodo className="h-4 w-4" />} />
        <Kpi label="Vencidas" value={tarefas.vencidas} sub="precisam de ação" icon={<AlertTriangle className="h-4 w-4" />} tone={tarefas.vencidas > 0 ? "danger" : "muted"} />
        <Kpi label="Próximos 7 dias" value={tarefas.proximas_7_dias} sub="com prazo chegando" icon={<CalendarClock className="h-4 w-4" />} tone={tarefas.proximas_7_dias > 0 ? "warning" : "muted"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Precisa de atenção */}
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Precisa de atenção
          </h2>
          {tarefas_atencao.length === 0 ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tudo em dia — nenhuma tarefa vencida ou próxima.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {tarefas_atencao.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{t.titulo}</p>
                    {t.projeto_nome && <p className="truncate text-xs text-muted-foreground">{t.projeto_nome}</p>}
                  </div>
                  <span className={`shrink-0 text-xs font-medium ${t.vencida ? "text-destructive" : "text-amber-400"}`}>
                    {t.vencida ? "Venceu " : ""}{formatPrazo(t.prazo)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/tarefas" className="mt-3 inline-block text-xs text-primary hover:underline">Ver todas as tarefas →</Link>
        </section>

        {/* Progresso por projeto */}
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FolderOpen className="h-4 w-4 text-primary" /> Progresso por projeto
          </h2>
          {projetos_progresso.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Nenhum projeto ativo.</p>
          ) : (
            <ul className="space-y-2.5">
              {projetos_progresso.slice(0, 6).map((p) => {
                const pct = p.total ? Math.round((p.concluidas / p.total) * 100) : 0
                return (
                  <li key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{p.nome}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {p.total === 0 ? "sem tarefas" : `${p.concluidas}/${p.total}`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Distribuição por status */}
      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">Tarefas por status</h2>
        {tarefas.total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(tarefas.por_status).map(([status, qtd]) => (
              <div key={status} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-muted-foreground">{status}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${STATUS_BAR[status] ?? "bg-primary"}`} style={{ width: `${(qtd / totalStatus) * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right tabular-nums">{qtd}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Repositórios por VPS */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Server className="h-4 w-4 text-muted-foreground" /> Repositórios por VPS
        </h2>
        {repositorios_por_vps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma VPS cadastrada. <Link to="/vps" className="text-primary underline">Cadastrar VPS</Link>.
          </p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {repositorios_por_vps.map((v) => (
              <div key={v.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <Link to="/vps" className="font-medium hover:underline">{v.nome ?? v.ip}</Link>
                  <span className="font-mono text-xs text-muted-foreground">{v.ip}</span>
                </div>
                {v.projetos.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Nenhum projeto vinculado.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {v.projetos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{p.nome}</span>
                        <span className="flex shrink-0 gap-2">
                          {p.site_url && <a href={p.site_url} target="_blank" rel="noopener noreferrer" title="Site" className="text-muted-foreground hover:text-foreground"><Globe className="h-3.5 w-3.5" /></a>}
                          {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-muted-foreground hover:text-foreground"><GitBranch className="h-3.5 w-3.5" /></a>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
