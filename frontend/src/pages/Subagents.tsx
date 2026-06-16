import { useState } from "react"
import type { Subagent } from "@/api/subagents"
import { subagentsApi } from "@/api/subagents"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, Select, TextArea, TextInput } from "@/components/ui/kit"
import { useSubagentMutations, useSubagents } from "@/hooks/useSubagents"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

const MODELOS = ["inherit", "haiku", "sonnet", "opus", "fable"]

export function Subagents() {
  const { data: subagents, isLoading, isError } = useSubagents()
  const { create, update, remove } = useSubagentMutations()
  const [editor, setEditor] = useState<Subagent | "novo" | null>(null)

  const all = subagents ?? []

  async function excluir(s: Subagent) {
    const ok = await confirm({
      title: `Excluir subagent "${s.name}"?`,
      description: "Remove o subagent e o arquivo em ~/.claude/agents. Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(s.id, {
      onSuccess: () => toast.success("Subagent excluído"),
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Subagents</h1>
          <div className="sub">Claudes isolados (modelo e ferramentas próprios), espelhados em ~/.claude/agents</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Novo subagent
        </Button>
      </div>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar subagents.
        </div>
      )}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="bot"
            title="Nenhum subagent ainda"
            action={
              <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
                Criar subagent
              </Button>
            }
          >
            Crie agentes isolados (ex.: revisor em Haiku read-only) e inclua nos seus plugins.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((s) => (
            <div key={s.id} className="card card-pad card-hover" onClick={() => setEditor(s)}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div className="avatar" style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}>
                    <Icon name="bot" size={15} />
                  </div>
                  <span className="truncate" style={{ fontWeight: 700 }}>
                    {s.name}
                  </span>
                </div>
                <span className="tag tag-otavio">
                  <span className="dot" /> {s.model}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px", minHeight: 38, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {s.description}
              </p>
              <div className="spread">
                <span className="t-meta mono truncate">{s.tools || "todas as tools"}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="trash"
                  onClick={(e) => {
                    e.stopPropagation()
                    excluir(s)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <SubagentEditor
          subagent={editor === "novo" ? null : editor}
          saving={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSave={(body) => {
            if (editor === "novo") {
              create.mutate(body, {
                onSuccess: () => {
                  toast.success("Subagent criado")
                  setEditor(null)
                },
                onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
              })
            } else {
              update.mutate(
                { id: editor.id, body },
                {
                  onSuccess: () => {
                    toast.success("Subagent salvo")
                    setEditor(null)
                  },
                  onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
                }
              )
            }
          }}
        />
      )}
    </div>
  )
}

function SubagentEditor({
  subagent,
  saving,
  onClose,
  onSave,
}: {
  subagent: Subagent | null
  saving: boolean
  onClose: () => void
  onSave: (body: { name?: string; description: string; model: string; tools: string | null; system_prompt: string }) => void
}) {
  const [name, setName] = useState(subagent?.name ?? "")
  const [description, setDescription] = useState(subagent?.description ?? "")
  const [model, setModel] = useState(subagent?.model ?? "inherit")
  const [tools, setTools] = useState(subagent?.tools ?? "")
  const [systemPrompt, setSystemPrompt] = useState(subagent?.system_prompt ?? "")
  const [erro, setErro] = useState("")
  const [melhorando, setMelhorando] = useState(false)

  async function melhorar() {
    if (!subagent) return
    setMelhorando(true)
    try {
      const r = await subagentsApi.melhorar(subagent.id)
      if (r.description) setDescription(r.description)
      if (r.system_prompt) setSystemPrompt(r.system_prompt)
      toast.success("Sugestão da IA aplicada", "Revise e salve")
    } catch (e) {
      toast.error("Não foi possível melhorar", e instanceof Error ? e.message : undefined)
    } finally {
      setMelhorando(false)
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!subagent) {
      const slug = name.trim().toLowerCase()
      if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
        setErro("Identificador: só minúsculas, números e hífens (máx. 64).")
        return
      }
    }
    if (!description.trim()) return setErro("Descrição é obrigatória.")
    if (!systemPrompt.trim()) return setErro("System prompt é obrigatório.")
    onSave({
      ...(subagent ? {} : { name: name.trim().toLowerCase() }),
      description: description.trim(),
      model,
      tools: tools.trim() || null,
      system_prompt: systemPrompt,
    })
  }

  return (
    <Modal onClose={onClose} title={subagent ? `Editar ${subagent.name}` : "Novo subagent"} size="lg">
      <form onSubmit={submit} className="stack" style={{ gap: 0 }}>
        {!subagent && (
          <Field label="Identificador (name) *" hint="kebab-case. Vira /<plugin>:<name> quando no plugin.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="code-reviewer" autoFocus required />
          </Field>
        )}
        <Field label="Descrição (quando delegar) *" hint="3ª pessoa, 'Use quando...' + gatilhos. É o que decide a invocação automática.">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Use quando…" />
        </Field>
        <div className="row wrap" style={{ gap: 10 }}>
          <div style={{ width: 160 }}>
            <Field label="Modelo">
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                {MODELOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tools" hint="CSV (vazio = todas). Read-only: Read, Grep, Glob">
            <TextInput value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Read, Grep, Glob" />
          </Field>
          <div style={{ alignSelf: "flex-end", paddingBottom: 16 }}>
            <Button type="button" size="sm" variant="ghost" onClick={() => setTools("Read, Grep, Glob")}>
              read-only
            </Button>
          </div>
        </div>
        <Field label="System prompt *">
          <TextArea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={10} placeholder="Você é um…" />
        </Field>

        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
        <div className="row" style={{ gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Salvando…" : subagent ? "Salvar" : "Criar"}
          </Button>
          {subagent && (
            <Button type="button" variant="ghost" icon="sparkle" onClick={melhorar} disabled={melhorando}>
              {melhorando ? "Melhorando…" : "Melhorar com IA"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
