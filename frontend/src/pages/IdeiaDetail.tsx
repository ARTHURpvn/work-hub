import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ideiaApi, type IdeiaChatMsg, type IdeiaStatus, type Projeto } from "@/api/projetos"
import { Icon } from "@/components/ui/Icon"
import { Button, Empty, IconButton, OriginTag } from "@/components/ui/kit"
import { useProjeto, useUpdateProjeto } from "@/hooks/useProjetos"
import { toast } from "@/store/toastStore"

export function IdeiaDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: projeto, isLoading } = useProjeto(id ?? null)
  const update = useUpdateProjeto()

  const [brief, setBrief] = useState("")
  const [briefDirty, setBriefDirty] = useState(false)
  const [savingBrief, setSavingBrief] = useState(false)
  const briefInit = useRef(false)

  const { data: chatInicial } = useQuery({
    queryKey: ["ideia", "chat", id],
    queryFn: () => ideiaApi.getChat(id!),
    enabled: !!id,
  })
  const [msgs, setMsgs] = useState<IdeiaChatMsg[]>([])
  const [draft, setDraft] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState<IdeiaStatus | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projeto && !briefInit.current) {
      setBrief(projeto.brief ?? "")
      briefInit.current = true
    }
  }, [projeto])

  useEffect(() => {
    if (chatInicial) setMsgs(chatInicial)
  }, [chatInicial])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [msgs, status, enviando])

  if (isLoading) {
    return (
      <div className="page">
        <p className="muted">Carregando…</p>
      </div>
    )
  }
  if (!projeto) {
    return (
      <div className="page">
        <div className="card card-pad">
          <Empty
            icon="folder"
            title="Ideia não encontrada"
            action={
              <Button icon="chevron_l" onClick={() => navigate("/projetos")}>
                Voltar para projetos
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  async function salvarBrief() {
    if (!id) return
    setSavingBrief(true)
    try {
      const saved = await ideiaApi.saveBrief(id, brief)
      qc.setQueryData<Projeto>(["projetos", "one", id], saved)
      qc.invalidateQueries({ queryKey: ["projetos", "list"] })
      setBriefDirty(false)
      toast.success("Brief salvo")
    } catch (e) {
      toast.error("Erro ao salvar brief", e instanceof Error ? e.message : undefined)
    } finally {
      setSavingBrief(false)
    }
  }

  async function aprovarNoBrief(texto: string) {
    if (!id) return
    const novo = brief.trim() ? `${brief}\n\n${texto}` : texto
    setBrief(novo)
    setSavingBrief(true)
    try {
      const saved = await ideiaApi.saveBrief(id, novo)
      qc.setQueryData<Projeto>(["projetos", "one", id], saved)
      qc.invalidateQueries({ queryKey: ["projetos", "list"] })
      setBriefDirty(false)
      toast.success("Aprovado e salvo nas anotações")
    } catch (e) {
      setBriefDirty(true)
      toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined)
    } finally {
      setSavingBrief(false)
    }
  }

  async function enviar() {
    const txt = draft.trim()
    if (!txt || enviando || !id) return
    setDraft("")
    setEnviando(true)
    setStatus({ fase: "conectando", elapsed: 0, chars: 0 })
    const tmpId = `u-${msgs.length}-${txt.length}`
    setMsgs((m) => [...m, { id: tmpId, role: "user", content: txt, criado_em: "" }])
    await ideiaApi.chatStream(id, txt, {
      onStatus: (s) => setStatus(s),
      onDone: ({ reply }) => {
        setStatus(null)
        setEnviando(false)
        if (reply.trim()) {
          setMsgs((m) => [...m, { id: `a-${m.length}`, role: "assistant", content: reply, criado_em: "" }])
        }
        qc.invalidateQueries({ queryKey: ["ideia", "chat", id] })
      },
      onError: (msg) => {
        setStatus(null)
        setEnviando(false)
        toast.error("Erro na IA", msg)
      },
    })
  }

  async function limpar() {
    if (!id) return
    try {
      await ideiaApi.clearChat(id)
      setMsgs([])
      qc.invalidateQueries({ queryKey: ["ideia", "chat", id] })
    } catch (e) {
      toast.error("Erro ao limpar", e instanceof Error ? e.message : undefined)
    }
  }

  function promover() {
    update.mutate(
      { id: projeto!.id, data: { rascunho: false } },
      {
        onSuccess: () => {
          toast.success("Ideia promovida para projeto ativo")
          navigate("/projetos")
        },
        onError: (e) => toast.error("Erro ao promover", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <div className="skill-detail">
      <div className="skill-detail-head">
        <IconButton name="chevron_l" size={20} onClick={() => navigate("/projetos")} />
        <div className="row grow" style={{ gap: 10, minWidth: 0 }}>
          <OriginTag origin={projeto.origem} />
          <span style={{ fontWeight: 700, fontSize: 16 }} className="truncate">
            {projeto.nome || "(sem nome)"}
          </span>
          <span className="chip static">
            <Icon name="sparkle" size={12} /> Ideia
          </span>
        </div>
        <Button icon="check" onClick={promover} disabled={update.isPending}>
          Promover para ativo
        </Button>
      </div>

      <div className="skill-detail-body">
        {/* Brief */}
        <div className="skill-pane left">
          <div className="skill-pane-head">
            <Icon name="edit" size={16} style={{ color: "var(--accent)" }} />
            <span className="grow" style={{ fontWeight: 700 }}>
              Brief — o que o projeto precisa ter
            </span>
            <Button size="sm" variant="primary" icon="check" onClick={salvarBrief} disabled={!briefDirty || savingBrief}>
              {savingBrief ? "Salvando…" : "Salvar"}
            </Button>
          </div>
          <div className="skill-editor-area">
            <textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value)
                setBriefDirty(true)
              }}
              placeholder="Escreva aqui o que o projeto precisa ter — objetivo, funcionalidades, escopo, stack, riscos. Ou peça pra IA ao lado e clique em 'Inserir no brief'."
            />
          </div>
        </div>

        {/* Assistente */}
        <div className="skill-pane">
          <div className="chat-wrap">
            <div className="skill-pane-head">
              <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
              <span className="grow" style={{ fontWeight: 700 }}>
                Assistente
              </span>
              {msgs.length > 0 && (
                <Button size="sm" variant="ghost" icon="trash" onClick={limpar}>
                  Limpar
                </Button>
              )}
            </div>

            <div className="chat-thread" ref={threadRef}>
              {msgs.length === 0 && !enviando && (
                <div className="cmsg ai">
                  <div className="cav">IA</div>
                  <div className="cbubble">
                    Me conta a ideia. Eu considero suas outras anotações e recomendo as skills certas para ajudar a definir o que o projeto precisa ter. Cada resposta pode ser aprovada e salva direto no brief. Por onde começamos?
                  </div>
                </div>
              )}

              {msgs.map((m) => (
                <div key={m.id} className={"cmsg " + (m.role === "assistant" ? "ai" : "me")}>
                  <div className="cav">{m.role === "assistant" ? "IA" : "eu"}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                    <div className="cbubble">{m.content}</div>
                    {m.role === "assistant" && (
                      <button
                        className="csug"
                        type="button"
                        disabled={savingBrief}
                        onClick={() => aprovarNoBrief(m.content)}
                      >
                        <Icon name="check" size={12} /> Aprovar e salvar no brief
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {enviando && (
                <div className="cmsg ai">
                  <div className="cav">IA</div>
                  <div className="cbubble">
                    {status ? (
                      <span className="ai-progress">
                        <span className="ai-progress-fase">
                          {status.fase === "conectando" ? "conectando…" : "escrevendo…"}
                        </span>
                        <span className="ai-progress-meta">
                          {status.elapsed}s · {status.chars} chars
                        </span>
                      </span>
                    ) : (
                      <span className="typing">
                        <span />
                        <span />
                        <span />
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="composer">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    enviar()
                  }
                }}
                placeholder="Pergunte ou descreva a ideia… (Enter envia, Shift+Enter quebra linha)"
                rows={1}
              />
              <button className="csend" type="button" onClick={enviar} disabled={enviando || !draft.trim()}>
                <Icon name="send" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
