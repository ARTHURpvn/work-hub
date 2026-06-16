import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Skill } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, TextInput } from "@/components/ui/kit"
import { SkillsAssistente } from "@/components/skills/SkillsAssistente"
import { useSkillMutations, useSkills } from "@/hooks/useSkills"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

function templateSkill(name: string, displayTitle: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${displayTitle || name}\n\nDescreva aqui o que esta skill faz e quando usá-la.\n`
}

export function Skills() {
  const navigate = useNavigate()
  const { data: skills, isLoading, isError } = useSkills()
  const { create, migrar } = useSkillMutations()

  const [novoOpen, setNovoOpen] = useState(false)
  const [name, setName] = useState("")
  const [displayTitle, setDisplayTitle] = useState("")
  const [description, setDescription] = useState("")
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [assistOpen, setAssistOpen] = useState(false)

  const all = skills ?? []
  const q = busca.trim().toLowerCase()
  const visiveis = q
    ? all.filter((s) =>
        [s.display_title, s.name, s.descricao ?? ""].some((c) => c.toLowerCase().includes(q))
      )
    : all

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    const slug = name.trim().toLowerCase()
    if (!/^[a-z0-9-]{1,64}$/.test(slug)) {
      setErro("Identificador: só minúsculas, números e hífens (máx. 64).")
      return
    }
    if (!description.trim()) {
      setErro("Descrição é obrigatória.")
      return
    }
    create.mutate(
      { display_title: displayTitle.trim() || slug, conteudo: templateSkill(slug, displayTitle.trim(), description.trim()) },
      {
        onSuccess: (skill) => {
          setNovoOpen(false)
          setName("")
          setDisplayTitle("")
          setDescription("")
          toast.success("Skill criada na API")
          navigate(`/skills/${skill.id}`)
        },
        onError: (e2) => setErro(e2 instanceof Error ? e2.message : "Erro ao criar"),
      }
    )
  }

  async function handleMigrar() {
    const ok = await confirm({
      title: "Migrar skills locais?",
      description: "As suas skills em ~/.claude/skills serão criadas como skills custom na API (pula as que já existem).",
      confirmLabel: "Migrar",
    })
    if (!ok) return
    migrar.mutate(undefined, {
      onSuccess: (r) => {
        const msg = `${r.criadas} criada(s), ${r.puladas} já existia(m)${r.erros.length ? `, ${r.erros.length} erro(s)` : ""}`
        if (r.erros.length) toast.error("Migração com avisos", msg)
        else toast.success("Migração concluída", msg)
      },
      onError: (e) => toast.error("Erro ao migrar", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Minhas Skills</h1>
          <div className="sub">Skills custom no seu workspace da Anthropic (Skill Management API)</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button icon="sparkle" onClick={() => setAssistOpen(true)}>
            Assistente
          </Button>
          <Button icon="download" onClick={handleMigrar} disabled={migrar.isPending}>
            {migrar.isPending ? "Migrando…" : "Migrar locais"}
          </Button>
          <Button variant="primary" icon="plus" onClick={() => setNovoOpen(true)}>
            Nova skill
          </Button>
        </div>
      </div>

      {assistOpen && <SkillsAssistente onClose={() => setAssistOpen(false)} />}

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar skills.
        </div>
      )}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="sparkle"
            title="Nenhuma skill na API ainda"
            action={
              <div className="row" style={{ gap: 8, justifyContent: "center" }}>
                <Button icon="download" onClick={handleMigrar} disabled={migrar.isPending}>
                  Migrar locais
                </Button>
                <Button variant="primary" icon="plus" onClick={() => setNovoOpen(true)}>
                  Criar skill
                </Button>
              </div>
            }
          >
            Crie uma skill custom ou migre as suas skills locais (~/.claude/skills) para o workspace da API.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <>
          <div className="input-icon" style={{ maxWidth: 320, marginBottom: 18 }}>
            <Icon name="search" />
            <input
              className="input"
              value={busca}
              placeholder="Pesquisar skill…"
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {visiveis.length > 0 ? (
            <div className="grid g-3">
              {visiveis.map((s) => (
                <SkillCard key={s.id} s={s} onOpen={() => navigate(`/skills/${s.id}`)} />
              ))}
            </div>
          ) : (
            <div className="card card-pad">
              <Empty icon="search" title="Nenhuma skill encontrada">
                Nada corresponde a “{busca}”.
              </Empty>
            </div>
          )}
        </>
      )}

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Nova skill">
        <form onSubmit={handleCriar} className="stack" style={{ gap: 0 }}>
          <Field label="Identificador (name) *" hint="Só minúsculas, números e hífens. Vai no frontmatter da skill.">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="minha-skill" autoFocus required />
          </Field>
          <Field label="Título de exibição">
            <TextInput value={displayTitle} onChange={(e) => setDisplayTitle(e.target.value)} placeholder="Minha Skill" />
          </Field>
          <Field label="Descrição (quando usar) *">
            <TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Use quando…" />
          </Field>
          {erro && <p style={{ color: "var(--danger)", fontSize: 13 }}>{erro}</p>}
          <div className="row" style={{ gap: 8 }}>
            <Button type="submit" variant="primary" disabled={create.isPending}>
              {create.isPending ? "Criando…" : "Criar e abrir"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SkillCard({ s, onOpen }: { s: Skill; onOpen: () => void }) {
  return (
    <div className="card card-pad card-hover" onClick={onOpen}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 9, minWidth: 0 }}>
          <div
            className="avatar"
            style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
          >
            <Icon name="sparkle" size={15} />
          </div>
          <span className="truncate" style={{ fontWeight: 700 }}>
            {s.display_title || s.name}
          </span>
        </div>
        <span className="tag tag-otavio">
          <span className="dot" /> custom
        </span>
      </div>
      <p
        className="muted"
        style={{
          fontSize: 13.5,
          margin: "0 0 12px",
          minHeight: 38,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {s.descricao || "Sem descrição."}
      </p>
      <div className="spread">
        <span className="t-meta mono truncate">{s.name}</span>
        <span className="row" style={{ gap: 6, color: "var(--text-2)", fontWeight: 600, fontSize: 13 }}>
          Abrir <Icon name="chevron_r" size={15} />
        </span>
      </div>
    </div>
  )
}
