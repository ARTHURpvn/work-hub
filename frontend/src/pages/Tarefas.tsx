import { useMemo, useState } from "react"
import type { Tarefa } from "@/api/tarefas"
import { Icon } from "@/components/ui/Icon"
import { Button, Empty, OriginTag, Select, StatusPill } from "@/components/ui/kit"
import { daysUntil, dueLabel, isLate, origemMeta, STATUSES, subProgress } from "@/lib/domain"
import { useProjetos } from "@/hooks/useProjetos"
import { useCreateTarefa, useTarefas } from "@/hooks/useTarefas"
import { toast } from "@/store/toastStore"
import { useTaskModalStore } from "@/store/taskModalStore"

type StatusFilter = "all" | "late" | (typeof STATUSES)[number]["id"]
type Sort = "due" | "created" | "status"

const SORTS: [Sort, string][] = [
  ["due", "Prazo"],
  ["created", "Recentes"],
  ["status", "Status"],
]

export function Tarefas() {
  const openTask = useTaskModalStore((s) => s.open)
  const { data: tarefas } = useTarefas()
  const { data: projetos } = useProjetos()
  const createTarefa = useCreateTarefa()

  const [status, setStatus] = useState<StatusFilter>("all")
  const [proj, setProj] = useState("all")
  const [sort, setSort] = useState<Sort>("due")
  const [q, setQ] = useState("")

  const all = tarefas ?? []

  const list = useMemo(() => {
    let l = all.slice()
    if (status === "late") l = l.filter(isLate)
    else if (status !== "all") l = l.filter((t) => t.status === status)
    if (proj !== "all") l = l.filter((t) => t.projeto_id === proj)
    if (q.trim()) l = l.filter((t) => (t.titulo || "").toLowerCase().includes(q.trim().toLowerCase()))
    l.sort((a, b) => {
      if (sort === "due") return (daysUntil(a.prazo) ?? 99999) - (daysUntil(b.prazo) ?? 99999)
      if (sort === "created") return b.criado_em.localeCompare(a.criado_em)
      return STATUSES.findIndex((s) => s.id === a.status) - STATUSES.findIndex((s) => s.id === b.status)
    })
    return l
  }, [all, status, proj, sort, q])

  function create() {
    createTarefa.mutate(
      { titulo: "Nova tarefa" },
      {
        onSuccess: (t: Tarefa) => openTask(t.id),
        onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  const abertas = all.filter((t) => t.status !== "Concluido").length
  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "Todas" },
    ...STATUSES.map((s) => ({ id: s.id as StatusFilter, label: s.label })),
    { id: "late", label: "Vencidas" },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Tarefas</h1>
          <div className="sub">
            {abertas} abertas · {all.length} no total
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={create}>
          Nova tarefa
        </Button>
      </div>

      {all.length ? (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
            {statusFilters.map((s) => (
              <span
                key={s.id}
                className={"chip" + (status === s.id ? " on" : "")}
                onClick={() => setStatus(s.id)}
              >
                {s.label}
              </span>
            ))}
          </div>

          <div className="row wrap" style={{ gap: 10, marginBottom: 18 }}>
            <div className="input-icon" style={{ flex: 1, minWidth: 180, maxWidth: 260 }}>
              <Icon name="search" />
              <input
                className="input"
                value={q}
                placeholder="Buscar tarefa…"
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={proj} onChange={(e) => setProj(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="all">Todos os projetos</option>
              {(projetos ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome || "(sem nome)"}
                </option>
              ))}
            </Select>
            <div className="seg" style={{ marginLeft: "auto" }}>
              {SORTS.map(([id, lbl]) => (
                <button key={id} className={sort === id ? "on" : ""} onClick={() => setSort(id)}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {list.length ? (
            <div className="card card-pad">
              {list.map((t) => {
                const lt = isLate(t)
                const dl = dueLabel(t.prazo)
                const p = (projetos ?? []).find((x) => x.id === t.projeto_id)
                const sp = subProgress(t)
                return (
                  <div key={t.id} className="lrow click" onClick={() => openTask(t.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }} className="truncate">
                        {t.titulo || "(sem título)"}
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        {p && <OriginTag origin={origemMeta(p.origem).id} />}
                        {sp.total ? (
                          <span className="t-meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon name="check_list" size={13} />
                            {sp.done}/{sp.total}
                          </span>
                        ) : null}
                        {t.links.length ? (
                          <span className="t-meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <Icon name="link" size={13} />
                            {t.links.length}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <StatusPill status={t.status} late={lt} />
                    <span
                      className="t-meta mono"
                      style={{ width: 70, textAlign: "right", color: lt ? "var(--danger)" : "var(--muted)" }}
                    >
                      {dl.txt}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card card-pad">
              <Empty icon="check_list" title="Nenhuma tarefa neste filtro" />
            </div>
          )}
        </>
      ) : (
        <div className="card card-pad">
          <Empty
            icon="check_list"
            title="Nenhuma tarefa ainda"
            action={
              <Button variant="primary" icon="plus" onClick={create}>
                Criar primeira tarefa
              </Button>
            }
          >
            Cada tarefa tem subtarefas (checklist) e links. Abra uma para editar tudo.
          </Empty>
        </div>
      )}
    </div>
  )
}
