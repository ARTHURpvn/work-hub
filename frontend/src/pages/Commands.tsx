import { useState } from "react"
import type { Command } from "@/api/commands"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, TextArea, TextInput } from "@/components/ui/kit"
import { useCommandMutations, useCommands } from "@/hooks/useCommands"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Commands() {
  const { data: commands, isLoading, isError } = useCommands()
  const { create, update, remove } = useCommandMutations()
  const [editor, setEditor] = useState<Command | "novo" | null>(null)

  const all = commands ?? []

  async function excluir(c: Command) {
    const ok = await confirm({
      title: `Excluir command "/${c.name}"?`,
      description: "Remove o command e o arquivo em ~/.claude/commands. Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(c.id, {
      onSuccess: () => toast.success("Command excluído"),
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Commands</h1>
          <div className="sub">Slash commands (/nome) reutilizáveis — espelhados em ~/.claude/commands e no plugin</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Novo command
        </Button>
      </div>

      {isError && <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Erro ao carregar commands.</div>}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="send"
            title="Nenhum command ainda"
            action={<Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>Criar command</Button>}
          >
            Prompt reutilizável acionado por /nome. Use $ARGUMENTS no corpo para receber argumentos.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((c) => (
            <div key={c.id} className="card card-pad card-hover" onClick={() => setEditor(c)}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div className="avatar" style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}>
                    <Icon name="send" size={15} />
                  </div>
                  <span className="truncate mono" style={{ fontWeight: 700 }}>/{c.name}</span>
                </div>
                {c.model && <span className="tag tag-otavio"><span className="dot" /> {c.model}</span>}
              </div>
              <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px", minHeight: 38, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {c.descricao || c.conteudo.slice(0, 120)}
              </p>
              <div className="spread">
                <span className="t-meta mono truncate">{c.argument_hint || (c.allowed_tools ? c.allowed_tools : "—")}</span>
                <Button size="sm" variant="ghost" icon="trash" onClick={(e) => { e.stopPropagation(); excluir(c) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <CommandEditor
          command={editor === "novo" ? null : editor}
          saving={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSave={(body) => {
            const cb = {
              onSuccess: () => { toast.success(editor === "novo" ? "Command criado" : "Command salvo"); setEditor(null) },
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

function CommandEditor({
  command,
  saving,
  onClose,
  onSave,
}: {
  command: Command | null
  saving: boolean
  onClose: () => void
  onSave: (body: import("@/api/commands").CommandInput) => void
}) {
  const [name, setName] = useState(command?.name ?? "")
  const [descricao, setDescricao] = useState(command?.descricao ?? "")
  const [argumentHint, setArgumentHint] = useState(command?.argument_hint ?? "")
  const [model, setModel] = useState(command?.model ?? "")
  const [allowedTools, setAllowedTools] = useState(command?.allowed_tools ?? "")
  const [conteudo, setConteudo] = useState(command?.conteudo ?? "")
  const [erro, setErro] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!command && !/^[a-z0-9-]{1,64}$/.test(name.trim().toLowerCase())) {
      return setErro("Identificador: só minúsculas, números e hífens.")
    }
    if (!conteudo.trim()) return setErro("Conteúdo (prompt) é obrigatório.")
    onSave({
      ...(command ? {} : { name: name.trim().toLowerCase() }),
      descricao: descricao.trim() || null,
      argument_hint: argumentHint.trim() || null,
      model: model.trim() || null,
      allowed_tools: allowedTools.trim() || null,
      conteudo,
    })
  }

  return (
    <Modal onClose={onClose} title={command ? `Editar /${command.name}` : "Novo command"} size="lg">
      <form onSubmit={submit} className="stack" style={{ gap: 0 }}>
        {!command && (
          <Field label="Identificador (name) *" hint="kebab-case. Vira /<plugin>:<name> no plugin.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="code-review" autoFocus required />
          </Field>
        )}
        <Field label="Descrição">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que esse comando faz" />
        </Field>
        <div className="row" style={{ gap: 10 }}>
          <Field label="Argument hint" hint="Ex.: [arquivo] [prioridade]">
            <TextInput value={argumentHint} onChange={(e) => setArgumentHint(e.target.value)} placeholder="[arquivo]" />
          </Field>
          <div style={{ width: 140 }}>
            <Field label="Model (opcional)">
              <TextInput value={model} onChange={(e) => setModel(e.target.value)} placeholder="opus" />
            </Field>
          </div>
        </div>
        <Field label="Allowed tools (CSV, opcional)">
          <TextInput value={allowedTools} onChange={(e) => setAllowedTools(e.target.value)} placeholder="Read, Grep, Bash(git *)" />
        </Field>
        <Field label="Prompt *" hint="Corpo do comando. $ARGUMENTS = todos os args; $1/$2 = posicionais.">
          <TextArea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={9} placeholder="Revise $ARGUMENTS para bugs e segurança." />
        </Field>
        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
        <div className="row" style={{ gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Salvando…" : command ? "Salvar" : "Criar"}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </Modal>
  )
}
