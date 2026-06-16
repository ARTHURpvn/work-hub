import { useEffect, useState } from "react"
import type { Plugin } from "@/api/plugins"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Check, Empty, Field, TextInput } from "@/components/ui/kit"
import { usePluginMutations, usePlugins } from "@/hooks/usePlugins"
import { useSkills } from "@/hooks/useSkills"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Plugins() {
  const { data: plugins, isLoading, isError } = usePlugins()
  const { data: skills } = useSkills()
  const { create, update, remove, exportar } = usePluginMutations()

  const [editor, setEditor] = useState<Plugin | "novo" | null>(null)

  const all = plugins ?? []

  async function excluir(p: Plugin) {
    const ok = await confirm({
      title: `Excluir plugin "${p.display_title}"?`,
      description: "Remove o plugin (não afeta as skills). Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(p.id, {
      onSuccess: () => toast.success("Plugin excluído"),
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  function exportarPlugin(p: Plugin) {
    exportar.mutate(
      { id: p.id, name: p.name },
      {
        onSuccess: ({ avisos }) => {
          if (avisos.length) toast.error("Plugin exportado com avisos", avisos.join(" · "))
          else toast.success("Plugin exportado", "Baixe o .zip e rode /plugin marketplace add")
        },
        onError: (e) => toast.error("Erro ao exportar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Plugins</h1>
          <div className="sub">Empacote suas skills como um plugin instalável do Claude Code</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Novo plugin
        </Button>
      </div>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar plugins.
        </div>
      )}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="folder"
            title="Nenhum plugin ainda"
            action={
              <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
                Criar plugin
              </Button>
            }
          >
            Agrupe skills num plugin versionado e exporte como marketplace local pro Claude Code.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((p) => (
            <div key={p.id} className="card card-pad">
              <div className="spread" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 9, minWidth: 0 }}>
                  <div
                    className="avatar"
                    style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
                  >
                    <Icon name="folder" size={15} />
                  </div>
                  <span className="truncate" style={{ fontWeight: 700 }}>
                    {p.display_title}
                  </span>
                </div>
                <span className="t-meta mono">v{p.version}</span>
              </div>
              <p
                className="muted"
                style={{ fontSize: 13.5, margin: "0 0 12px", minHeight: 38, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
              >
                {p.descricao || "Sem descrição."}
              </p>
              <div className="spread">
                <span className="t-meta mono truncate">
                  {p.name} · {p.skill_ids.length} skill(s)
                </span>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 12 }}>
                <Button
                  size="sm"
                  variant="primary"
                  icon="download"
                  onClick={() => exportarPlugin(p)}
                  disabled={exportar.isPending || p.skill_ids.length === 0}
                  title={p.skill_ids.length === 0 ? "Adicione skills primeiro" : undefined}
                >
                  Exportar
                </Button>
                <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditor(p)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" icon="trash" onClick={() => excluir(p)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editor && (
        <PluginEditor
          plugin={editor === "novo" ? null : editor}
          skills={(skills ?? []).map((s) => ({ id: s.id, label: s.display_title || s.name }))}
          saving={create.isPending || update.isPending}
          onClose={() => setEditor(null)}
          onSave={(body) => {
            if (editor === "novo") {
              create.mutate(body, {
                onSuccess: () => {
                  toast.success("Plugin criado")
                  setEditor(null)
                },
                onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
              })
            } else {
              update.mutate(
                { id: editor.id, body },
                {
                  onSuccess: () => {
                    toast.success("Plugin atualizado")
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

function PluginEditor({
  plugin,
  skills,
  saving,
  onClose,
  onSave,
}: {
  plugin: Plugin | null
  skills: { id: string; label: string }[]
  saving: boolean
  onClose: () => void
  onSave: (body: { name?: string; display_title: string; descricao: string; version: string; skill_ids: string[] }) => void
}) {
  const [name, setName] = useState(plugin?.name ?? "")
  const [displayTitle, setDisplayTitle] = useState(plugin?.display_title ?? "")
  const [descricao, setDescricao] = useState(plugin?.descricao ?? "")
  const [version, setVersion] = useState(plugin?.version ?? "0.1.0")
  const [sel, setSel] = useState<Set<string>>(new Set(plugin?.skill_ids ?? []))
  const [erro, setErro] = useState("")

  useEffect(() => setErro(""), [name, displayTitle, version, sel])

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!plugin) {
      const slug = name.trim().toLowerCase()
      if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
        setErro("Identificador: só minúsculas, números e hífens (máx. 64).")
        return
      }
    }
    if (sel.size === 0) {
      setErro("Selecione ao menos uma skill.")
      return
    }
    onSave({
      ...(plugin ? {} : { name: name.trim().toLowerCase() }),
      display_title: displayTitle.trim() || name.trim(),
      descricao: descricao.trim(),
      version: version.trim() || "0.1.0",
      skill_ids: [...sel],
    })
  }

  return (
    <Modal onClose={onClose} title={plugin ? "Editar plugin" : "Novo plugin"} size="lg">
      <form onSubmit={submit} className="stack" style={{ gap: 0 }}>
        {!plugin && (
          <Field label="Identificador (name) *" hint="kebab-case. Vira /<plugin>:<skill> no Claude Code.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="meu-toolkit" autoFocus required />
          </Field>
        )}
        <div className="row" style={{ gap: 10 }}>
          <Field label="Título">
            <TextInput value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} placeholder="Meu Toolkit" />
          </Field>
          <div style={{ width: 120 }}>
            <Field label="Versão">
              <TextInput value={version} onChange={(e) => setVersion(e.target.value)} placeholder="0.1.0" />
            </Field>
          </div>
        </div>
        <Field label="Descrição">
          <TextInput value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que esse plugin faz" />
        </Field>

        <Field label={`Skills (${sel.size} selecionada(s))`}>
          <div className="card" style={{ maxHeight: 260, overflow: "auto", padding: 6 }}>
            {skills.length === 0 && <p className="muted" style={{ padding: 8, margin: 0 }}>Nenhuma skill disponível.</p>}
            {skills.map((s) => (
              <div
                key={s.id}
                className="lrow click"
                style={{ padding: "7px 8px", gap: 10 }}
                onClick={() => toggle(s.id)}
              >
                <Check on={sel.has(s.id)} onClick={() => toggle(s.id)} />
                <span className="truncate">{s.label}</span>
              </div>
            ))}
          </div>
        </Field>

        {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
        <div className="row" style={{ gap: 8 }}>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Salvando…" : plugin ? "Salvar" : "Criar"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
