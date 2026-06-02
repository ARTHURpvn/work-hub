import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { skillsApi, type ChatMensagem, type SkillOrigem } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Button, IconButton } from "@/components/ui/kit"
import { useSkillMutations } from "@/hooks/useSkills"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

const ORIGENS: SkillOrigem[] = ["pessoal", "plugin", "desktop"]
const SRC_LABEL: Record<SkillOrigem, string> = { pessoal: "Minha", plugin: "Plugin", desktop: "Desktop" }
const SRC_CLS: Record<SkillOrigem, string> = { pessoal: "tag-otavio", plugin: "tag-titan", desktop: "tag-free" }
const SUGESTOES = ["Reescrever mais curto", "Adicionar exemplos", "Checar contradições"]

interface Msg {
  who: "ai" | "me"
  text: string
  sugestao?: string
}

function diffLinhas(atual: string, novo: string): { add: string[]; del: string[] } {
  const a = new Set(atual.split("\n"))
  const b = new Set(novo.split("\n"))
  return {
    add: novo.split("\n").filter((l) => l.trim() && !a.has(l)).slice(0, 14),
    del: atual.split("\n").filter((l) => l.trim() && !b.has(l)).slice(0, 14),
  }
}

export function SkillDetail() {
  const { origem, slug } = useParams<{ origem: string; slug: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { update, remove, importar, chat } = useSkillMutations()

  const validOrigem = ORIGENS.includes(origem as SkillOrigem) ? (origem as SkillOrigem) : null

  const { data: skill, isLoading, isError } = useQuery({
    queryKey: ["skill", origem, slug],
    queryFn: () => skillsApi.get(validOrigem!, slug!),
    enabled: !!validOrigem && !!slug,
  })

  const [conteudo, setConteudo] = useState("")
  const [dirty, setDirty] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  const editavel = skill?.editavel ?? false

  useEffect(() => {
    if (skill) {
      setConteudo(skill.conteudo)
      setDirty(false)
      setMsgs([
        {
          who: "ai",
          text: `Li a skill "${skill.name}". Como quer melhorá-la? Posso reescrever, adicionar exemplos ou checar contradições.`,
        },
      ])
      setPendingIdx(null)
    }
  }, [skill])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [msgs, chat.isPending])

  if (!validOrigem || !slug) {
    return (
      <div className="page">
        <p className="muted">Skill inválida.</p>
        <Button onClick={() => navigate("/skills")}>Voltar</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="page">
        <p className="muted">Carregando…</p>
      </div>
    )
  }

  if (isError || !skill) {
    return (
      <div className="page">
        <p className="muted">Skill não encontrada.</p>
        <Button icon="chevron_l" onClick={() => navigate("/skills")}>
          Voltar
        </Button>
      </div>
    )
  }

  function salvar() {
    update.mutate(
      { slug: slug!, conteudo },
      {
        onSuccess: () => {
          setDirty(false)
          toast.success("Skill salva")
        },
        onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function excluir() {
    const ok = await confirm({
      title: "Excluir skill?",
      description: "A pasta da skill será removida do disco. Esta ação não pode ser desfeita.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(slug!, {
      onSuccess: () => {
        toast.success("Skill excluída")
        navigate("/skills")
      },
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
  }

  function doImport() {
    importar.mutate(
      { origem: validOrigem!, slug: slug! },
      {
        onSuccess: (novo) => {
          toast.success("Importada para as suas")
          navigate(`/skills/pessoal/${novo.slug}`)
        },
        onError: (e) => toast.error("Erro ao importar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  function send(text?: string) {
    const userText = (text ?? draft).trim()
    if (!userText || chat.isPending) return
    const next: Msg[] = [...msgs, { who: "me", text: userText }]
    setMsgs(next)
    setDraft("")
    const mensagens: ChatMensagem[] = next.map((m) => ({
      role: m.who === "ai" ? "assistant" : "user",
      content: m.text,
    }))
    chat.mutate(
      { slug: slug!, mensagens },
      {
        onSuccess: (r) => {
          setMsgs((m) => {
            if (r.sugestao_conteudo) setPendingIdx(m.length)
            return [...m, { who: "ai", text: r.reply, sugestao: r.sugestao_conteudo ?? undefined }]
          })
        },
        onError: (e) => toast.error("Não foi possível responder", e instanceof Error ? e.message : undefined),
      }
    )
  }

  function aplicar(sugestao: string) {
    update.mutate(
      { slug: slug!, conteudo: sugestao },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["skill", origem, slug] })
          setConteudo(sugestao)
          setDirty(false)
          setPendingIdx(null)
          toast.success("Sugestão aplicada")
          setMsgs((m) => [...m, { who: "ai", text: "Aplicado! O conteúdo ao lado foi atualizado." }])
        },
        onError: (e) => toast.error("Erro ao aplicar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <div className="skill-detail">
      <div className="skill-detail-head">
        <IconButton name="chevron_l" onClick={() => navigate("/skills")} aria-label="Voltar" />
        <div className="row grow" style={{ gap: 10 }}>
          <div
            className="avatar"
            style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
          >
            <Icon name="sparkle" size={15} />
          </div>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
                {skill.name}
              </span>
              <span className={"tag " + SRC_CLS[validOrigem]}>
                <span className="dot" />
                {SRC_LABEL[validOrigem]}
              </span>
            </div>
            <div className="t-meta mono">{slug}</div>
          </div>
        </div>
        {editavel ? (
          <>
            <Button variant="danger" size="sm" icon="trash" onClick={excluir}>
              Excluir
            </Button>
            <Button variant="primary" size="sm" icon="check" onClick={salvar} disabled={!dirty || update.isPending}>
              {update.isPending ? "Salvando…" : dirty ? "Salvar" : "Salvo"}
            </Button>
          </>
        ) : (
          <Button variant="primary" size="sm" icon="download" onClick={doImport} disabled={importar.isPending}>
            Importar para as minhas
          </Button>
        )}
      </div>

      <div className="skill-detail-body">
        {/* esquerda: chat (só editável) */}
        <div className="skill-pane left">
          {editavel ? (
            <div className="chat-wrap">
              <div className="skill-pane-head">
                <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
                <span className="grow" style={{ fontWeight: 700 }}>
                  Melhorar com IA
                </span>
              </div>
              <div className="chat-thread" ref={threadRef}>
                {msgs.map((m, i) => {
                  const dif = m.sugestao ? diffLinhas(conteudo, m.sugestao) : null
                  return (
                    <div key={i} className={"cmsg " + (m.who === "ai" ? "ai" : "me")}>
                      <div className="cav">{m.who === "ai" ? <Icon name="sparkle" size={14} /> : "EU"}</div>
                      <div className="cbubble">
                        {m.text}
                        {dif && (dif.add.length > 0 || dif.del.length > 0) ? (
                          <div>
                            <div className="cdiff">
                              {dif.del.map((d, j) => (
                                <div key={"d" + j} className="ln del">
                                  <span className="s">−</span>
                                  {d}
                                </div>
                              ))}
                              {dif.add.map((a, j) => (
                                <div key={"a" + j} className="ln add">
                                  <span className="s">+</span>
                                  {a}
                                </div>
                              ))}
                            </div>
                            {pendingIdx === i ? (
                              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon="check"
                                  onClick={() => aplicar(m.sugestao!)}
                                  disabled={update.isPending}
                                >
                                  Aplicar
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setPendingIdx(null)}>
                                  Descartar
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                {chat.isPending ? (
                  <div className="cmsg ai">
                    <div className="cav">
                      <Icon name="sparkle" size={14} />
                    </div>
                    <div className="cbubble">
                      <div className="typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="csuggest">
                {SUGESTOES.map((s) => (
                  <button key={s} className="csug" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>

              <div className="composer">
                <textarea
                  value={draft}
                  rows={1}
                  placeholder="Debata, peça mudanças…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                />
                <button className="csend" onClick={() => send()} disabled={!draft.trim() || chat.isPending}>
                  <Icon name="send" size={17} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, margin: "auto", textAlign: "center", maxWidth: 320 }}>
              <div className="empty">
                <div className="ic">
                  <Icon name="sparkle" size={26} />
                </div>
                <h3>Skill somente leitura</h3>
                <p>Importe esta skill para as suas para poder editá-la e melhorá-la com IA.</p>
                <Button variant="primary" icon="download" onClick={doImport} disabled={importar.isPending}>
                  Importar para as minhas
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* direita: conteúdo atual */}
        <div className="skill-pane">
          <div className="skill-pane-head">
            <Icon name="edit" size={15} style={{ color: "var(--muted)" }} />
            <span className="grow" style={{ fontWeight: 700 }}>
              {editavel ? "Conteúdo da skill" : "Conteúdo (leitura)"}
            </span>
            {editavel && dirty ? <span className="t-meta">não salvo</span> : null}
          </div>
          <div className="skill-editor-area">
            <textarea
              value={conteudo}
              readOnly={!editavel}
              spellCheck={false}
              onChange={(e) => {
                setConteudo(e.target.value)
                setDirty(true)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
