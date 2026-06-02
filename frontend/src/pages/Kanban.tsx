import { useState } from "react"
import type { Status, Tarefa } from "@/api/tarefas"
import { Icon } from "@/components/ui/Icon"
import { Button, Empty, OriginTag, Select } from "@/components/ui/kit"
import { dueLabel, isLate, origemMeta, STATUSES, subProgress } from "@/lib/domain"
import { useProjetos } from "@/hooks/useProjetos"
import { useCreateTarefa, useTarefas, useUpdateStatus } from "@/hooks/useTarefas"
import { useTaskModalStore } from "@/store/taskModalStore"

function KCard({
  t,
  origem,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  t: Tarefa
  origem: string | null
  onOpen: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const sp = subProgress(t)
  const lt = isLate(t)
  const dl = dueLabel(t.prazo)
  return (
    <div
      className={"kcard" + (dragging ? " dragging" : "")}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
    >
      <h5>{t.titulo || "(sem título)"}</h5>
      <div className="meta">
        {origem && <OriginTag origin={origem} />}
        {lt && (
          <span className="pill pill-late" style={{ fontSize: 10.5, padding: "1px 7px" }}>
            vencida
          </span>
        )}
        {sp.total ? (
          <span className="sub-mini">
            <Icon name="check_list" size={12} />
            {sp.done}/{sp.total}
          </span>
        ) : null}
        {t.prazo && !lt ? (
          <span className="sub-mini">
            <Icon name="clock" size={12} />
            {dl.txt}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function Kanban() {
  const openTask = useTaskModalStore((s) => s.open)
  const { data: tarefas } = useTarefas()
  const { data: projetos } = useProjetos()
  const createTarefa = useCreateTarefa()
  const updateStatus = useUpdateStatus()

  const [proj, setProj] = useState("all")
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<string | null>(null)

  const all = tarefas ?? []
  const list = proj === "all" ? all : all.filter((t) => t.projeto_id === proj)
  const projetoDe = (id: string | null) => (projetos ?? []).find((p) => p.id === id)

  function drop(statusId: Status) {
    if (dragId) updateStatus.mutate({ id: dragId, status: statusId })
    setDragId(null)
    setOverCol(null)
  }

  function create() {
    createTarefa.mutate(
      { titulo: "Nova tarefa", projeto_id: proj !== "all" ? proj : null },
      { onSuccess: (t: Tarefa) => openTask(t.id) }
    )
  }

  if (!all.length) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="t-display">Kanban</h1>
        </div>
        <div className="card card-pad">
          <Empty
            icon="board"
            title="Sem tarefas para organizar"
            action={
              <Button variant="primary" icon="plus" onClick={create}>
                Criar tarefa
              </Button>
            }
          >
            Crie tarefas e arraste os cards entre as colunas para mudar o status.
          </Empty>
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 1320 }}>
      <div className="page-head">
        <div>
          <h1 className="t-display">Kanban</h1>
          <div className="sub">Arraste os cards entre as colunas</div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Select value={proj} onChange={(e) => setProj(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="all">Todos os projetos</option>
            {(projetos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || "(sem nome)"}
              </option>
            ))}
          </Select>
          <Button variant="primary" icon="plus" onClick={create}>
            Tarefa
          </Button>
        </div>
      </div>

      <div className="board">
        {STATUSES.map((s) => {
          const col = list.filter((t) => t.status === s.id)
          return (
            <div
              key={s.id}
              className={"kcol" + (overCol === s.id ? " over" : "")}
              onDragOver={(e) => {
                e.preventDefault()
                if (overCol !== s.id) setOverCol(s.id)
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setOverCol(null)
              }}
              onDrop={() => drop(s.id)}
            >
              <div className="kcol-head">
                <span className="kdot" style={{ background: s.kdot }} />
                <h4>{s.label}</h4>
                <span className="n">{col.length}</span>
              </div>
              {col.map((t) => {
                const p = projetoDe(t.projeto_id)
                return (
                  <KCard
                    key={t.id}
                    t={t}
                    origem={p ? origemMeta(p.origem).id : null}
                    dragging={dragId === t.id}
                    onDragStart={(e) => {
                      setDragId(t.id)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverCol(null)
                    }}
                    onOpen={() => {
                      if (!dragId) openTask(t.id)
                    }}
                  />
                )
              })}
              {!col.length ? (
                <div style={{ textAlign: "center", padding: "16px 0", color: "var(--muted)", fontSize: 12.5 }}>—</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
