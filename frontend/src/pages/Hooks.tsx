import { useState } from "react"
import type { Hook } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, Select, TextArea, TextInput } from "@/components/ui/kit"
import { useHookMutations, useHooks } from "@/hooks/useHooks"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

const EVENTOS = [
  "PreToolUse", "PostToolUse", "PostToolUseFailure", "UserPromptSubmit", "Stop",
  "SubagentStart", "SubagentStop", "SessionStart", "SessionEnd", "Notification",
  "PreCompact", "PostCompact", "PermissionRequest", "FileChanged",
]
const EVENTOS_COM_MATCHER = new Set(["PreToolUse", "PostToolUse", "PostToolUseFailure", "PermissionRequest", "Notification", "FileChanged"])

export function Hooks() {
  const { data: hooks, isLoading, isError } = useHooks()
  const { create, update, remove } = useHookMutations()
  const [editor, setEditor] = useState<Hook | "novo" | null>(null)

  const all = hooks ?? []

  async function excluir(h: Hook) {
    const ok = await confirm({
      title: "Excluir hook?",
      description: "Remove o hook e os vínculos. Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(h.id, {
      onSuccess: () => toast.success("Hook excluído"),
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Hooks</h1>
          <div className="sub">Automação determinística por evento — empacotada no plugin (hooks/hooks.json)</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Novo hook
        </Button>
      </div>

      <div className="card card-pad" style={{ borderColor: "var(--accent)", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Icon name="alert" size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 13 }}>
          O <b>command</b> de um hook é executado pelo Claude Code <b>na sua máquina</b> quando o evento dispara. O workhub apenas
          armazena e empacota — <b>nunca executa</b>. Revise o comando antes de instalar o plugin.
        </span>
      </div>

      {isError && <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Erro ao carregar hooks.</div>}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="clock"
            title="Nenhum hook ainda"
            action={<Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>Criar hook</Button>}
          >
            Ex.: rodar lint/teste após Edit|Write (PostToolUse) — automação que <i>deve</i> acontecer.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((h) => (
            <div key={h.id} className="card card-pad card-hover" onClick={() => setEditor(h)}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div className="avatar" style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}>
                    <Icon name="clock" size={15} />
                  </div>
                  <span className="truncate" style={{ fontWeight: 700 }}>{h.event}</span>
                </div>
                {h.matcher && <span className="tag tag-otavio"><span className="dot" /> {h.matcher}</span>}
              </div>
              <p className="muted mono" style={{ fontSize: 12.5, margin: "0 0 12px", minHeight: 36, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {h.command}
              </p>
              <div className="spread">
                <span className="t-meta truncate">{h.descricao || (h.timeout ? `timeout ${h.timeout}s` : "—")}</span>
                <Button size="sm" variant="ghost" icon="trash" onClick={(e) => { e.stopPropagation(); excluir(h) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <HookEditor
          hook={editor === "novo" ? null : editor}
          saving={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSave={(body) => {
            const cb = {
              onSuccess: () => { toast.success(editor === "novo" ? "Hook criado" : "Hook salvo"); setEditor(null) },
              onError: (e: unknown) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
            }
            if (editor === "novo") create.mutate(body, cb)
            else update.mutate({ id: editor.id, body }, cb)
          }}
        />
      )}
    </div>
  )
}

function HookEditor({
  hook,
  saving,
  onClose,
  onSave,
}: {
  hook: Hook | null
  saving: boolean
  onClose: () => void
  onSave: (body: import("@/api/hooks").HookInput) => void
}) {
  const [event, setEvent] = useState(hook?.event ?? "PostToolUse")
  const [matcher, setMatcher] = useState(hook?.matcher ?? "")
  const [command, setCommand] = useState(hook?.command ?? "")
  const [timeout, setTimeout] = useState(hook?.timeout != null ? String(hook.timeout) : "")
  const [descricao, setDescricao] = useState(hook?.descricao ?? "")
  const [erro, setErro] = useState("")

  const usaMatcher = EVENTOS_COM_MATCHER.has(event)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!command.trim()) return setErro("Command é obrigatório.")
    onSave({
      event,
      matcher: usaMatcher ? (matcher.trim() || "*") : null,
      command,
      timeout: timeout.trim() ? Number(timeout) : null,
      descricao: descricao.trim() || null,
    })
  }

  return (
    <Modal onClose={onClose} title={hook ? "Editar hook" : "Novo hook"} size="lg">
      <form onSubmit={submit} className="stack" style={{ gap: 0 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <div style={{ width: 200 }}>
            <Field label="Evento">
              <Select value={event} onChange={(e) => setEvent(e.target.value)}>
                {EVENTOS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
              </Select>
            </Field>
          </div>
          {usaMatcher && (
            <Field label="Matcher" hint='Ex.: Edit|Write · vazio = todos (*)'>
              <TextInput value={matcher} onChange={(e) => setMatcher(e.target.value)} placeholder="Edit|Write" />
            </Field>
          )}
          <div style={{ width: 110 }}>
            <Field label="Timeout (s)">
              <TextInput value={timeout} onChange={(e) => setTimeout(e.target.value.replace(/\D/g, ""))} placeholder="30" />
            </Field>
          </div>
        </div>
        <Field label="Command *" hint="Roda na sua máquina quando o hook dispara. ${CLAUDE_PLUGIN_ROOT} aponta pra raiz do plugin.">
          <TextArea value={command} onChange={(e) => setCommand(e.target.value)} rows={4} placeholder='"${CLAUDE_PLUGIN_ROOT}"/scripts/lint.sh' />
        </Field>
        <Field label="Descrição">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que esse hook faz" />
        </Field>
        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
        <div className="row" style={{ gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Salvando…" : hook ? "Salvar" : "Criar"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </Modal>
  )
}
