import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import type { SkillOrigem, SkillResumo } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, TextInput } from "@/components/ui/kit"
import { useSkillMutations, useSkills } from "@/hooks/useSkills"
import { toast } from "@/store/toastStore"

const SRC_META: Record<SkillOrigem, { label: string; cls: string }> = {
  pessoal: { label: "Minha", cls: "tag-otavio" },
  plugin: { label: "Plugin", cls: "tag-titan" },
  desktop: { label: "Desktop", cls: "tag-free" },
}

type Filter = "all" | SkillOrigem

export function Skills() {
  const navigate = useNavigate()
  const { data: skills, isLoading, isError } = useSkills()
  const { create } = useSkillMutations()

  const [filter, setFilter] = useState<Filter>("all")
  const [novoOpen, setNovoOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [erro, setErro] = useState("")

  const all = skills ?? []
  const mine = all.filter((s) => s.origem === "pessoal")
  const external = all.filter((s) => s.origem !== "pessoal")

  const counts = useMemo(() => {
    const c: Record<string, number> = { pessoal: 0, plugin: 0, desktop: 0 }
    for (const s of all) c[s.origem] = (c[s.origem] ?? 0) + 1
    return c
  }, [all])

  const showMine = filter === "all" || filter === "pessoal"
  const showExt = filter === "all" || filter === "plugin" || filter === "desktop"
  const extList =
    filter === "plugin"
      ? external.filter((s) => s.origem === "plugin")
      : filter === "desktop"
        ? external.filter((s) => s.origem === "desktop")
        : external

  function abrir(s: SkillResumo) {
    navigate(`/skills/${s.origem}/${s.slug}`)
  }

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    create.mutate(
      { slug: slug.trim(), name: name.trim() || slug.trim(), description: description.trim() },
      {
        onSuccess: (skill) => {
          setNovoOpen(false)
          setSlug("")
          setName("")
          setDescription("")
          toast.success("Skill criada")
          navigate(`/skills/pessoal/${skill.slug}`)
        },
        onError: (e2) => setErro(e2 instanceof Error ? e2.message : "Erro ao criar"),
      }
    )
  }

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "pessoal", label: `Minhas ${counts.pessoal}` },
    { id: "plugin", label: `Plugins ${counts.plugin}` },
    { id: "desktop", label: `Claude Desktop ${counts.desktop}` },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Skills do Claude</h1>
          <div className="sub">Selecione uma skill para ver o conteúdo e melhorar com IA</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setNovoOpen(true)}>
          Nova skill
        </Button>
      </div>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar skills. Verifique se os diretórios estão montados.
        </div>
      )}

      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="sparkle"
            title="Nenhuma skill ainda"
            action={
              <Button variant="primary" icon="plus" onClick={() => setNovoOpen(true)}>
                Criar primeira skill
              </Button>
            }
          >
            Skills suas são editáveis e melhoráveis com IA. As externas (plugins, Claude Desktop) você importa para
            editar.
          </Empty>
        </div>
      )}

      {!isLoading && !isError && all.length > 0 && (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 22 }}>
            {chips.map((c) => (
              <span key={c.id} className={"chip" + (filter === c.id ? " on" : "")} onClick={() => setFilter(c.id)}>
                {c.label}
              </span>
            ))}
          </div>

          {showMine && mine.length > 0 && (
            <div style={{ marginBottom: 26 }}>
              <div className="t-label" style={{ marginBottom: 12 }}>
                Minhas — editáveis
              </div>
              <div className="grid g-3">
                {mine.map((s) => (
                  <SkillCard key={`${s.origem}:${s.slug}`} s={s} onOpen={() => abrir(s)} />
                ))}
              </div>
            </div>
          )}

          {showExt && extList.length > 0 && (
            <div>
              <div className="t-label" style={{ marginBottom: 12 }}>
                Externas — leitura + importar
              </div>
              <div className="grid g-3">
                {extList.map((s) => (
                  <SkillCard key={`${s.origem}:${s.slug}`} s={s} onOpen={() => abrir(s)} />
                ))}
              </div>
            </div>
          )}

          {filter === "pessoal" && mine.length === 0 && (
            <div className="card card-pad">
              <Empty
                icon="sparkle"
                title="Você ainda não tem skills próprias"
                action={
                  <Button variant="primary" icon="plus" onClick={() => setNovoOpen(true)}>
                    Criar skill
                  </Button>
                }
              >
                Crie do zero ou importe uma skill externa.
              </Empty>
            </div>
          )}
        </>
      )}

      <Modal open={novoOpen} onClose={() => setNovoOpen(false)} title="Nova skill">
        <form onSubmit={handleCriar} className="stack" style={{ gap: 0 }}>
          <Field label="Identificador (pasta) *" hint="Só letras, números, '-' e '_'.">
            <TextInput value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-skill" autoFocus required />
          </Field>
          <Field label="Nome">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Minha Skill" />
          </Field>
          <Field label="Descrição (quando usar)">
            <TextInput value={description} onChange={(e) => setDescription(e.target.value)} />
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

function SkillCard({ s, onOpen }: { s: SkillResumo; onOpen: () => void }) {
  const meta = SRC_META[s.origem]
  const mine = s.origem === "pessoal"
  return (
    <div className="card card-pad card-hover" onClick={onOpen}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 9 }}>
          <div
            className="avatar"
            style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
          >
            <Icon name="sparkle" size={15} />
          </div>
          <span className={"tag " + meta.cls}>
            <span className="dot" />
            {meta.label}
          </span>
        </div>
        {mine ? (
          <span className="t-meta" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--accent)" }}>
            <Icon name="sparkle" size={13} /> IA
          </span>
        ) : (
          <span className="t-meta">somente leitura</span>
        )}
      </div>
      <h3 className="t-h2" style={{ marginBottom: 5 }}>
        {s.name || "(sem nome)"}
      </h3>
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
        {s.description || "Sem descrição."}
      </p>
      <div className="row" style={{ gap: 6, color: "var(--text-2)", fontWeight: 600, fontSize: 13 }}>
        <span>{mine ? "Abrir e melhorar" : "Abrir"}</span>
        <Icon name="chevron_r" size={15} />
      </div>
    </div>
  )
}
