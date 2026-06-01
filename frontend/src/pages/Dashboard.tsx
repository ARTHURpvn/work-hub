import { AlertTriangle, Clock, FolderOpen, GitBranch, Globe, ListTodo, Server } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/useDashboard"

function StatCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </div>
  )
}

function Chips({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
  if (entries.length === 0) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => (
        <span key={k} className="rounded-full border px-2 py-0.5 text-xs">
          {k}: <strong>{v}</strong>
        </span>
      ))}
    </div>
  )
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const { projetos, tarefas, agentes, jobs, repositorios_por_vps, projetos_sem_vps } = data

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Cartões de resumo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Projetos" icon={<FolderOpen className="h-4 w-4" />}>
          <p className="text-2xl font-bold">{projetos.ativos}<span className="text-sm font-normal text-muted-foreground"> ativos</span></p>
          <p className="text-xs text-muted-foreground">
            {projetos.arquivados} arquivados · {projetos.com_vps} com VPS · {projetos.com_autenticacao} com login
          </p>
          <div className="mt-2"><Chips data={projetos.por_origem} /></div>
        </StatCard>

        <StatCard title="Tarefas" icon={<ListTodo className="h-4 w-4" />}>
          <p className="text-2xl font-bold">{tarefas.total}</p>
          <div className="mt-1 flex flex-col gap-1 text-xs">
            {tarefas.vencidas > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" /> {tarefas.vencidas} vencida(s)
              </span>
            )}
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> {tarefas.proximas_7_dias} nos próximos 7 dias
            </span>
          </div>
          <div className="mt-2"><Chips data={tarefas.por_status} /></div>
        </StatCard>

        <StatCard title="Agentes" icon={<Server className="h-4 w-4" />}>
          <p className="text-2xl font-bold">{agentes.total}</p>
          <div className="mt-2"><Chips data={agentes.por_status} /></div>
        </StatCard>

        <StatCard title="Jobs" icon={<Server className="h-4 w-4" />}>
          <p className="text-2xl font-bold">{jobs.total}</p>
          <div className="mt-2"><Chips data={jobs.por_status} /></div>
        </StatCard>
      </div>

      {projetos.publicaveis > 0 && (
        <Link to="/projetos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Globe className="h-4 w-4" /> {projetos.publicaveis} projeto(s) publicável(is) no LinkedIn
        </Link>
      )}

      {/* Repositórios por VPS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Repositórios por VPS</h2>

        {repositorios_por_vps.length === 0 && projetos_sem_vps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma VPS cadastrada. <Link to="/vps" className="underline">Cadastrar VPS</Link>.
          </p>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {repositorios_por_vps.map((v) => (
            <div key={v.id} className="rounded-lg border bg-background p-4 shadow-sm">
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
                      <span>{p.nome}</span>
                      <span className="flex gap-2">
                        {p.site_url && <a href={p.site_url} target="_blank" rel="noopener noreferrer" title="Site" className="text-muted-foreground hover:text-foreground"><Globe className="h-3.5 w-3.5" /></a>}
                        {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-muted-foreground hover:text-foreground"><GitBranch className="h-3.5 w-3.5" /></a>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          {projetos_sem_vps.length > 0 && (
            <div className="rounded-lg border border-dashed bg-background p-4">
              <p className="text-sm font-medium text-muted-foreground">Sem VPS vinculada</p>
              <ul className="mt-2 space-y-1">
                {projetos_sem_vps.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{p.nome} <span className="text-xs text-muted-foreground">({p.origem})</span></span>
                    <span className="flex gap-2">
                      {p.site_url && <a href={p.site_url} target="_blank" rel="noopener noreferrer" title="Site" className="text-muted-foreground hover:text-foreground"><Globe className="h-3.5 w-3.5" /></a>}
                      {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" title="GitHub" className="text-muted-foreground hover:text-foreground"><GitBranch className="h-3.5 w-3.5" /></a>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
