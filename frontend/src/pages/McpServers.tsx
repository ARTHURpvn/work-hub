import { useState } from "react"
import type { McpServer, ParConfig } from "@/api/mcpServers"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Check, Empty, Field, Select, TextInput } from "@/components/ui/kit"
import { useMcpMutations, useMcpServers } from "@/hooks/useMcpServers"
import { useSkills } from "@/hooks/useSkills"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function McpServers() {
  const { data: mcps, isLoading, isError } = useMcpServers()
  const { data: skills } = useSkills()
  const { create, update, remove } = useMcpMutations()
  const [editor, setEditor] = useState<McpServer | "novo" | null>(null)

  const all = mcps ?? []

  async function excluir(m: McpServer) {
    const ok = await confirm({
      title: `Excluir MCP "${m.name}"?`,
      description: "Remove o MCP e os vínculos. Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(m.id, {
      onSuccess: () => toast.success("MCP excluído"),
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">MCP Servers</h1>
          <div className="sub">Acessos externos (MCP) — cadastre, vincule a skills e empacote no plugin (.mcp.json)</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Novo MCP
        </Button>
      </div>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar MCP servers.
        </div>
      )}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="server"
            title="Nenhum MCP ainda"
            action={
              <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
                Criar MCP
              </Button>
            }
          >
            Cadastre um MCP server (stdio ou http). Segredos ficam cifrados e nunca saem no export (viram ${"{VAR}"}).
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((m) => (
            <div key={m.id} className="card card-pad card-hover" onClick={() => setEditor(m)}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div className="avatar" style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}>
                    <Icon name="server" size={15} />
                  </div>
                  <span className="truncate" style={{ fontWeight: 700 }}>{m.name}</span>
                </div>
                <span className="tag tag-otavio"><span className="dot" /> {m.transport}</span>
              </div>
              <p className="muted" style={{ fontSize: 13.5, margin: "0 0 12px", minHeight: 38, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {m.descricao || (m.transport === "http" ? m.url : `${m.command || ""} ${(m.args || []).join(" ")}`)}
              </p>
              <div className="spread">
                <span className="t-meta mono truncate">
                  {(m.env.length + m.headers.length)} var(s) · {m.skill_ids.length} skill(s)
                </span>
                <Button size="sm" variant="ghost" icon="trash" onClick={(e) => { e.stopPropagation(); excluir(m) }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <McpEditor
          mcp={editor === "novo" ? null : editor}
          skills={(skills ?? []).map((s) => ({ id: s.id, label: s.display_title || s.name }))}
          saving={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSave={(body) => {
            const cb = {
              onSuccess: () => { toast.success(editor === "novo" ? "MCP criado" : "MCP salvo"); setEditor(null) },
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

function ParesEditor({ titulo, pares, onChange }: { titulo: string; pares: ParConfig[]; onChange: (p: ParConfig[]) => void }) {
  function set(i: number, patch: Partial<ParConfig>) {
    onChange(pares.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  }
  return (
    <Field label={titulo}>
      <div className="stack" style={{ gap: 6 }}>
        {pares.map((p, i) => (
          <div key={i} className="row" style={{ gap: 6 }}>
            <TextInput style={{ flex: 1 }} value={p.key} placeholder="KEY" onChange={(e) => set(i, { key: e.target.value })} />
            <TextInput
              style={{ flex: 1.4 }}
              type={p.secret ? "password" : "text"}
              value={p.value}
              placeholder={p.secret ? "•••• (segredo)" : "valor"}
              onChange={(e) => set(i, { value: e.target.value })}
            />
            <button type="button" className={"csug" + (p.secret ? "" : "")} onClick={() => set(i, { secret: !p.secret })} title="Marcar como segredo (cifrado, vira ${KEY} no export)">
              {p.secret ? "🔒 secret" : "público"}
            </button>
            <Button type="button" size="sm" variant="ghost" icon="x" onClick={() => onChange(pares.filter((_, j) => j !== i))} />
          </div>
        ))}
        <Button type="button" size="sm" variant="ghost" icon="plus" onClick={() => onChange([...pares, { key: "", value: "", secret: true }])}>
          adicionar
        </Button>
      </div>
    </Field>
  )
}

function McpEditor({
  mcp,
  skills,
  saving,
  onClose,
  onSave,
}: {
  mcp: McpServer | null
  skills: { id: string; label: string }[]
  saving: boolean
  onClose: () => void
  onSave: (body: import("@/api/mcpServers").McpInput) => void
}) {
  const [name, setName] = useState(mcp?.name ?? "")
  const [transport, setTransport] = useState<"stdio" | "http">(mcp?.transport ?? "stdio")
  const [command, setCommand] = useState(mcp?.command ?? "")
  const [argsText, setArgsText] = useState((mcp?.args ?? []).join(" "))
  const [url, setUrl] = useState(mcp?.url ?? "")
  const [env, setEnv] = useState<ParConfig[]>(mcp?.env ?? [])
  const [headers, setHeaders] = useState<ParConfig[]>(mcp?.headers ?? [])
  const [descricao, setDescricao] = useState(mcp?.descricao ?? "")
  const [sel, setSel] = useState<Set<string>>(new Set(mcp?.skill_ids ?? []))
  const [erro, setErro] = useState("")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!mcp && !/^[a-z0-9-]{1,64}$/.test(name.trim().toLowerCase())) {
      return setErro("Identificador: só minúsculas, números e hífens.")
    }
    if (transport === "stdio" && !command.trim()) return setErro("stdio exige command.")
    if (transport === "http" && !url.trim()) return setErro("http exige url.")
    onSave({
      ...(mcp ? {} : { name: name.trim().toLowerCase() }),
      transport,
      command: transport === "stdio" ? command.trim() : null,
      args: transport === "stdio" ? argsText.trim().split(/\s+/).filter(Boolean) : null,
      url: transport === "http" ? url.trim() : null,
      env: env.filter((p) => p.key.trim()),
      headers: transport === "http" ? headers.filter((p) => p.key.trim()) : [],
      descricao: descricao.trim() || null,
      skill_ids: [...sel],
    })
  }

  return (
    <Modal onClose={onClose} title={mcp ? `Editar ${mcp.name}` : "Novo MCP"} size="lg">
      <form onSubmit={submit} className="stack" style={{ gap: 0 }}>
        {!mcp && (
          <Field label="Identificador (name) *" hint="kebab-case.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="swagger" autoFocus required />
          </Field>
        )}
        <div className="row" style={{ gap: 10 }}>
          <div style={{ width: 140 }}>
            <Field label="Transporte">
              <Select value={transport} onChange={(e) => setTransport(e.target.value as "stdio" | "http")}>
                <option value="stdio">stdio</option>
                <option value="http">http</option>
              </Select>
            </Field>
          </div>
          <Field label="Descrição">
            <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que esse MCP acessa" />
          </Field>
        </div>

        {transport === "stdio" ? (
          <>
            <Field label="Command *">
              <TextInput value={command} onChange={(e) => setCommand(e.target.value)} placeholder="npx" />
            </Field>
            <Field label="Args (separados por espaço)">
              <TextInput value={argsText} onChange={(e) => setArgsText(e.target.value)} placeholder="-y @org/mcp-server" />
            </Field>
            <ParesEditor titulo="Env (segredos viram ${KEY} no export)" pares={env} onChange={setEnv} />
          </>
        ) : (
          <>
            <Field label="URL *">
              <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.exemplo.com/mcp" />
            </Field>
            <ParesEditor titulo="Headers (segredos viram ${KEY} no export)" pares={headers} onChange={setHeaders} />
          </>
        )}

        <Field label={`Skills que ensinam a usar este MCP (${sel.size})`}>
          <div className="card" style={{ maxHeight: 180, overflow: "auto", padding: 6 }}>
            {skills.length === 0 && <p className="muted" style={{ padding: 8, margin: 0 }}>Nenhuma skill disponível.</p>}
            {skills.map((s) => (
              <div key={s.id} className="lrow click" style={{ padding: "7px 8px", gap: 10 }} onClick={() => setSel((x) => { const n = new Set(x); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })}>
                <Check on={sel.has(s.id)} onClick={() => setSel((x) => { const n = new Set(x); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n })} />
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </Field>

        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
        <div className="row" style={{ gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Salvando…" : mcp ? "Salvar" : "Criar"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        </div>
      </form>
    </Modal>
  )
}
