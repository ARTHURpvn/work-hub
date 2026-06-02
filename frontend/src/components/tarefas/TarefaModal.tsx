import { useEffect, useRef, useState } from "react"
import type { Status, Tarefa } from "@/api/tarefas"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Check, IconButton, Progress, Select, StatusPill, TextArea } from "@/components/ui/kit"
import { hostFromUrl, isLate, STATUSES, subProgress } from "@/lib/domain"
import { useProjetos } from "@/hooks/useProjetos"
import {
  useDeleteTarefa,
  useLinks,
  useSubtarefas,
  useTarefas,
  useUpdateStatus,
  useUpdateTarefa,
} from "@/hooks/useTarefas"
import { confirm } from "@/store/confirmStore"
import { useTaskModalStore } from "@/store/taskModalStore"
import { toast } from "@/store/toastStore"

export function TarefaModal() {
  const taskId = useTaskModalStore((s) => s.taskId)
  const close = useTaskModalStore((s) => s.close)
  const { data: tarefas } = useTarefas()
  const tarefa = (tarefas ?? []).find((t) => t.id === taskId) ?? null

  if (!taskId) return null

  if (!tarefa) {
    return (
      <Modal onClose={close} title="Tarefa" size="lg">
        <p className="muted">Carregando…</p>
      </Modal>
    )
  }

  return <TarefaModalInner key={tarefa.id} tarefa={tarefa} onClose={close} />
}

function TarefaModalInner({ tarefa, onClose }: { tarefa: Tarefa; onClose: () => void }) {
  const { data: projetos } = useProjetos()
  const update = useUpdateTarefa()
  const updateStatus = useUpdateStatus()
  const del = useDeleteTarefa()
  const subs = useSubtarefas()
  const links = useLinks()

  const [titulo, setTitulo] = useState(tarefa.titulo)
  const [descricao, setDescricao] = useState(tarefa.descricao ?? "")
  const [newSub, setNewSub] = useState("")
  const [newLink, setNewLink] = useState("")
  const titleRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!tarefa.titulo) setTimeout(() => titleRef.current?.focus(), 80)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveField(data: { titulo?: string; descricao?: string }) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      update.mutate({ id: tarefa.id, data })
    }, 500)
  }

  const late = isLate(tarefa)
  const sp = subProgress(tarefa)

  async function handleDelete() {
    const ok = await confirm({
      title: "Excluir tarefa",
      description: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    del.mutate(tarefa.id, {
      onSuccess: () => {
        toast.success("Tarefa excluída")
        onClose()
      },
    })
  }

  function addSub() {
    const titulo = newSub.trim()
    if (!titulo) return
    subs.add.mutate({ tarefaId: tarefa.id, titulo })
    setNewSub("")
  }

  function addLink() {
    let url = newLink.trim()
    if (!url) return
    if (!/^https?:/.test(url)) url = "https://" + url
    links.add.mutate({ tarefaId: tarefa.id, label: hostFromUrl(url), url })
    setNewLink("")
  }

  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
      <StatusPill status={tarefa.status} late={late} />
    </div>
  )

  const footer = (
    <>
      <div className="left">
        <Button variant="danger" size="sm" icon="trash" onClick={handleDelete}>
          Excluir
        </Button>
      </div>
      <Button variant="primary" onClick={onClose}>
        Concluir edição
      </Button>
    </>
  )

  return (
    <Modal onClose={onClose} title={header} footer={footer} size="lg">
      <input
        ref={titleRef}
        className="input"
        value={titulo}
        placeholder="Título da tarefa…"
        onChange={(e) => {
          setTitulo(e.target.value)
          saveField({ titulo: e.target.value })
        }}
        style={{ fontSize: 19, fontWeight: 700, border: "none", background: "none", padding: "0 0 10px", marginBottom: 4 }}
      />

      <div className="row wrap" style={{ gap: 18, marginBottom: 18 }}>
        <div>
          <div className="t-label" style={{ marginBottom: 5 }}>
            Projeto
          </div>
          <Select
            value={tarefa.projeto_id ?? ""}
            onChange={(e) => update.mutate({ id: tarefa.id, data: { projeto_id: e.target.value || null } })}
            style={{ minWidth: 150 }}
          >
            <option value="">—</option>
            {(projetos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || "(sem nome)"}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 5 }}>
            Status
          </div>
          <Select
            value={tarefa.status}
            onChange={(e) => updateStatus.mutate({ id: tarefa.id, status: e.target.value as Status })}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 5 }}>
            Prazo
          </div>
          <input
            type="date"
            className="input"
            value={tarefa.prazo ?? ""}
            onChange={(e) => update.mutate({ id: tarefa.id, data: { prazo: e.target.value || null } })}
          />
        </div>
      </div>

      <div className="det-block">
        <span className="t-label">Descrição</span>
        <TextArea
          value={descricao}
          placeholder="Detalhes, contexto, critérios de aceite…"
          onChange={(e) => {
            setDescricao(e.target.value)
            saveField({ descricao: e.target.value })
          }}
        />
      </div>

      <div className="det-block">
        <div className="spread" style={{ marginBottom: 10 }}>
          <span className="t-label">Subtarefas {sp.total ? `· ${sp.done}/${sp.total}` : ""}</span>
          {sp.total ? <span className="t-meta mono">{sp.pct}%</span> : null}
        </div>
        {sp.total ? (
          <div style={{ marginBottom: 12 }}>
            <Progress pct={sp.pct} />
          </div>
        ) : null}
        <div className="stack" style={{ gap: 2 }}>
          {tarefa.subtarefas.map((s) => (
            <div key={s.id} className="lrow" style={{ padding: "8px 4px" }}>
              <Check
                on={s.concluida}
                onClick={() =>
                  subs.update.mutate({ tarefaId: tarefa.id, subId: s.id, data: { concluida: !s.concluida } })
                }
              />
              <span
                style={{
                  flex: 1,
                  textDecoration: s.concluida ? "line-through" : "none",
                  color: s.concluida ? "var(--muted)" : "var(--text)",
                }}
              >
                {s.titulo}
              </span>
              <IconButton
                name="x"
                size={15}
                onClick={() => subs.remove.mutate({ tarefaId: tarefa.id, subId: s.id })}
              />
            </div>
          ))}
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <input
            className="input"
            value={newSub}
            placeholder="Adicionar subtarefa…"
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSub()}
          />
          <Button icon="plus" onClick={addSub}>
            Add
          </Button>
        </div>
      </div>

      <div className="det-block" style={{ marginBottom: 0 }}>
        <span className="t-label">Links</span>
        <div className="row wrap" style={{ gap: 8, marginTop: 8, marginBottom: 8 }}>
          {tarefa.links.map((l) => (
            <span key={l.id} className="chip static" style={{ gap: 8 }}>
              <a
                href={l.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "inherit", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="link" size={13} />
                {l.label || hostFromUrl(l.url)}
              </a>
              <span
                onClick={() => links.remove.mutate({ tarefaId: tarefa.id, linkId: l.id })}
                style={{ cursor: "pointer", display: "inline-flex" }}
              >
                <Icon name="x" size={13} />
              </span>
            </span>
          ))}
        </div>
        <div className="input-group">
          <input
            className="input"
            value={newLink}
            placeholder="Colar URL (PR, Figma, doc)…"
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
          />
          <Button icon="plus" onClick={addLink}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  )
}
