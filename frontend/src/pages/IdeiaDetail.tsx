import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ideiaApi, type IdeiaChatMsg, type IdeiaStatus, type Projeto } from "@/api/projetos"
import { Icon } from "@/components/ui/Icon"
import { OriginTag } from "@/components/ui/kit"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useProjeto, useUpdateProjeto } from "@/hooks/useProjetos"
import { cn } from "@/lib/utils"
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
    return <div className="p-8 text-muted-foreground">Carregando…</div>
  }
  if (!projeto) {
    return (
      <div className="flex flex-col items-center gap-4 p-16 text-center">
        <Icon name="folder" size={40} className="text-muted-foreground" />
        <p className="text-lg font-semibold">Ideia não encontrada</p>
        <Button onClick={() => navigate("/projetos")}>
          <Icon name="chevron_l" size={16} /> Voltar para projetos
        </Button>
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
    <div className="flex h-[calc(100vh-60px)] flex-col">
      {/* header */}
      <header className="flex shrink-0 items-center gap-3 border-b bg-card px-5 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projetos")} aria-label="Voltar">
          <Icon name="chevron_l" size={20} />
        </Button>
        <OriginTag origin={projeto.origem} />
        <h1 className="truncate text-base font-bold">{projeto.nome || "(sem nome)"}</h1>
        <Badge variant="secondary" className="gap-1">
          <Icon name="sparkle" size={12} /> Ideia
        </Badge>
        <div className="flex-1" />
        <Button onClick={promover} disabled={update.isPending}>
          <Icon name="check" size={16} /> Promover para ativo
        </Button>
      </header>

      {/* corpo: brief | assistente */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Brief */}
        <section className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center gap-2 border-b px-5 py-3">
            <Icon name="edit" size={16} className="text-primary" />
            <h2 className="flex-1 text-sm font-semibold">Brief — o que o projeto precisa ter</h2>
            <Button size="sm" onClick={salvarBrief} disabled={!briefDirty || savingBrief}>
              <Icon name="check" size={14} /> {savingBrief ? "Salvando…" : "Salvar"}
            </Button>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <Textarea
              value={brief}
              onChange={(e) => {
                setBrief(e.target.value)
                setBriefDirty(true)
              }}
              placeholder="Escreva aqui o que o projeto precisa ter — objetivo, funcionalidades, escopo, stack, riscos. Ou peça pra IA ao lado e clique em 'Aprovar e salvar no brief'."
              className="h-full resize-none font-mono text-[13px] leading-relaxed"
            />
          </div>
        </section>

        {/* Assistente */}
        <section className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b px-5 py-3">
            <Icon name="sparkle" size={16} className="text-primary" />
            <h2 className="flex-1 text-sm font-semibold">Assistente</h2>
            {msgs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={limpar}>
                <Icon name="trash" size={14} /> Limpar
              </Button>
            )}
          </div>

          <div ref={threadRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            {msgs.length === 0 && !enviando && (
              <ChatRow ai>
                Me conta a ideia. Eu considero suas outras anotações e recomendo as skills certas para
                definir o que o projeto precisa ter. Cada resposta pode ser aprovada e salva direto no
                brief. Por onde começamos?
              </ChatRow>
            )}

            {msgs.map((m) => (
              <ChatRow key={m.id} ai={m.role === "assistant"}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === "assistant" && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="mt-2"
                    disabled={savingBrief}
                    onClick={() => aprovarNoBrief(m.content)}
                  >
                    <Icon name="check" size={12} /> Aprovar e salvar no brief
                  </Button>
                )}
              </ChatRow>
            ))}

            {enviando && (
              <ChatRow ai>
                {status ? (
                  <span className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {status.fase === "conectando" ? "conectando…" : "escrevendo…"}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {status.elapsed}s · {status.chars} chars
                    </span>
                  </span>
                ) : (
                  <span className="flex gap-1 py-1">
                    <Dot /> <Dot /> <Dot />
                  </span>
                )}
              </ChatRow>
            )}
          </div>

          <div className="flex shrink-0 items-end gap-2 border-t p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  enviar()
                }
              }}
              placeholder="Pergunte ou descreva a ideia… (Enter envia, Shift+Enter quebra linha)"
              className="max-h-32 min-h-0 flex-1 resize-none"
              rows={1}
            />
            <Button size="icon" className="shrink-0 rounded-full" onClick={enviar} disabled={enviando || !draft.trim()}>
              <Icon name="send" size={16} />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

function ChatRow({ ai, children }: { ai?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex gap-2.5", ai ? "" : "flex-row-reverse")}>
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className={cn("text-xs font-bold", ai ? "bg-primary text-primary-foreground" : "bg-secondary")}
        >
          {ai ? "IA" : "eu"}
        </AvatarFallback>
      </Avatar>
      <div className={cn("flex max-w-[85%] flex-col", ai ? "items-start" : "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            ai ? "border bg-card" : "bg-primary text-primary-foreground"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function Dot() {
  return <span className="size-1.5 animate-pulse rounded-full bg-primary" />
}
