import { useState } from "react"
import type { Rotina } from "@/api/rotinas"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Check, Empty, Field, TextArea, TextInput } from "@/components/ui/kit"
import { useRotinaMutations, useRotinas } from "@/hooks/useRotinas"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Rotinas() {
  const { data: rotinas, isLoading } = useRotinas()
  const [editing, setEditing] = useState<Rotina | null>(null)
  const [novo, setNovo] = useState(false)

  const all = rotinas ?? []

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <div className="page-head">
        <div>
          <h1 className="t-display">Rotinas</h1>
          <div className="sub">Catálogo das rotinas do seu Claude Code</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setNovo(true)}>
          Nova rotina
        </Button>
      </div>

      <div
        className="card card-pad"
        style={{ marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start", background: "var(--bg-2)" }}
      >
        <Icon name="alert" size={16} style={{ color: "var(--muted)", marginTop: 2 }} />
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Aqui você cataloga e planeja suas rotinas (nome, comando/prompt e quando rodar). Este painel
          não executa as rotinas automaticamente — é um registro para você organizar e consultar.
        </p>
      </div>

      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="clock"
            title="Nenhuma rotina cadastrada"
            action={
              <Button variant="primary" icon="plus" onClick={() => setNovo(true)}>
                Criar primeira rotina
              </Button>
            }
          >
            Cadastre as rotinas que seu Claude Code executa — com o comando e o agendamento.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-2">
          {all.map((r) => (
            <div key={r.id} className="card card-pad card-hover" onClick={() => setEditing(r)}>
              <div className="spread" style={{ marginBottom: 8 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div
                    className="avatar"
                    style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
                  >
                    <Icon name="clock" size={15} />
                  </div>
                  <span style={{ fontWeight: 700 }} className="truncate">
                    {r.nome}
                  </span>
                </div>
                <span className={"pill " + (r.ativa ? "pill-done" : "pill-todo")}>
                  <span className="dot" /> {r.ativa ? "ativa" : "pausada"}
                </span>
              </div>
              {r.descricao && (
                <p
                  className="muted"
                  style={{ fontSize: 13, margin: "0 0 10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {r.descricao}
                </p>
              )}
              <div className="row wrap" style={{ gap: 7 }}>
                {r.agendamento && (
                  <span className="chip static">
                    <Icon name="calendar" size={13} /> {r.agendamento}
                  </span>
                )}
                {r.comando && (
                  <span className="chip static mono" style={{ maxWidth: "100%" }}>
                    <span className="truncate" style={{ maxWidth: 220 }}>
                      {r.comando}
                    </span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(novo || editing) && (
        <RotinaModal
          rotina={editing}
          onClose={() => {
            setNovo(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function RotinaModal({ rotina, onClose }: { rotina: Rotina | null; onClose: () => void }) {
  const { create, update, remove } = useRotinaMutations()
  const editando = !!rotina

  const [form, setForm] = useState({
    nome: rotina?.nome ?? "",
    agendamento: rotina?.agendamento ?? "",
    descricao: rotina?.descricao ?? "",
    comando: rotina?.comando ?? "",
    ativa: rotina?.ativa ?? true,
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe um nome")
      return
    }
    const data = {
      nome: form.nome.trim(),
      agendamento: form.agendamento.trim() || null,
      descricao: form.descricao.trim() || null,
      comando: form.comando.trim() || null,
      ativa: form.ativa,
    }
    if (editando) {
      update.mutate(
        { id: rotina!.id, data },
        {
          onSuccess: () => {
            toast.success("Rotina salva")
            onClose()
          },
          onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
        }
      )
    } else {
      create.mutate(data, {
        onSuccess: () => {
          toast.success("Rotina criada")
          onClose()
        },
        onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
      })
    }
  }

  async function excluir() {
    const ok = await confirm({
      title: "Excluir rotina?",
      description: "Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(rotina!.id, {
      onSuccess: () => {
        toast.success("Rotina excluída")
        onClose()
      },
    })
  }

  return (
    <Modal
      onClose={onClose}
      title={editando ? "Editar rotina" : "Nova rotina"}
      footer={
        <>
          {editando && (
            <Button variant="danger" size="sm" icon="trash" onClick={excluir} style={{ marginRight: "auto" }}>
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" icon="check" onClick={salvar} disabled={create.isPending || update.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <Field label="Nome">
        <TextInput value={form.nome} autoFocus onChange={(e) => set("nome", e.target.value)} placeholder="Ex: Resumo diário de PRs" />
      </Field>
      <Field label="Agendamento" hint="Texto livre ou cron. Ex.: 'todo dia 9h' ou '0 9 * * *'.">
        <TextInput value={form.agendamento} onChange={(e) => set("agendamento", e.target.value)} placeholder="todo dia 9h" />
      </Field>
      <Field label="Descrição">
        <TextArea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="O que esta rotina faz?" />
      </Field>
      <Field label="Comando / prompt" hint="O que o Claude Code deve rodar.">
        <TextArea
          value={form.comando}
          onChange={(e) => set("comando", e.target.value)}
          placeholder="claude -p 'resuma os PRs abertos…'"
          style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}
        />
      </Field>
      <div className="row" style={{ gap: 10 }}>
        <Check on={form.ativa} onClick={() => set("ativa", !form.ativa)} />
        <span style={{ fontWeight: 600 }}>Ativa</span>
      </div>
    </Modal>
  )
}
