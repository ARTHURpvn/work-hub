import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { skillsApi, type ChatMensagem } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Button, IconButton } from "@/components/ui/kit"
import { useSkillMutations } from "@/hooks/useSkills"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { update, remove, chat } = useSkillMutations()

  const { data: skill, isLoading, isError } = useQuery({
    queryKey: ["skill", id],
    queryFn: () => skillsApi.get(id!),
    enabled: !!id,
  })

  const [conteudo, setConteudo] = useState("")
  const [dirty, setDirty] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [pendingIdx, setPendingIdx] = useState<number | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skill) {
      setConteudo(skill.conteudo)
      setDirty(false)
      setMsgs([
        {
          who: "ai",
          text: `Li a skill "${skill.display_title}". Como quer melhorá-la? Posso reescrever, adicionar exemplos ou checar contradições.`,
        },
      ])
      setPendingIdx(null)
    }
  }, [skill])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [msgs, chat.isPending])

  if (isLoading) {
    return (
      <div className="page">
        <p className="muted">Carregando…</p>
      </div>
    )
  }
  if (isError || !skill || !id) {
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
      { id: id!, conteudo },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["skill", id] })
          setDirty(false)
          toast.success("Nova versão salva na API")
        },
        onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function excluir() {
    const ok = await confirm({
      title: "Excluir skill?",
      description: "Remove todas as versões e a skill no workspace da API. Não pode ser desfeito.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(id!, {
      onSuccess: () => {
        toast.success("Skill excluída")
        navigate("/skills")
      },
      onError: (e) => toast.error("Erro ao excluir", e instanceof Error ? e.message : undefined),
    })
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
      { id: id!, mensagens },
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
      { id: id!, conteudo: sugestao },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["skill", id] })
          setConteudo(sugestao)
          setDirty(false)
          setPendingIdx(null)
          toast.success("Sugestão aplicada (nova versão)")
          setMsgs((m) => [...m, { who: "ai", text: "Aplicado! Nova versão criada na API." }])
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
                {skill.display_title}
              </span>
              <span className="tag tag-otavio">
                <span className="dot" /> custom
              </span>
            </div>
            <div className="t-meta mono">
              {skill.name}
              {skill.versao_atual ? ` · v${skill.versao_atual}` : ""}
            </div>
          </div>
        </div>
        <Button variant="danger" size="sm" icon="trash" onClick={excluir}>
          Excluir
        </Button>
        <Button variant="primary" size="sm" icon="check" onClick={salvar} disabled={!dirty || update.isPending}>
          {update.isPending ? "Salvando…" : dirty ? "Salvar versão" : "Salvo"}
        </Button>
      </div>

      <div className="skill-detail-body">
        <div className="skill-pane left">
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
        </div>

        <div className="skill-pane">
          <div className="skill-pane-head">
            <Icon name="edit" size={15} style={{ color: "var(--muted)" }} />
            <span className="grow" style={{ fontWeight: 700 }}>
              SKILL.md
            </span>
            {dirty ? <span className="t-meta">não salvo</span> : null}
          </div>
          <div className="skill-editor-area">
            <textarea
              value={conteudo}
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
