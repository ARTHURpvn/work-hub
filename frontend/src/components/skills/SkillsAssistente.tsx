import { useEffect, useRef, useState } from "react"
import type { AssistenteAcao, AssistenteStatus } from "@/api/skills"
import { skillsApi } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/kit"
import { useSkillMutations, useSkills } from "@/hooks/useSkills"
import { diffLinhas } from "@/lib/diff"
import { toast } from "@/store/toastStore"

interface Msg {
  who: "me" | "ai"
  text: string
  acoes?: AssistenteAcao[]
}

const FASE_LABEL: Record<string, string> = {
  conectando: "Conectando ao Claude Code…",
  pensando: "Pensando…",
  gerando: "Gerando proposta…",
}

const SUGESTOES = [
  "Padronize a descrição de todas",
  "Crie 3 skills novas para meu fluxo de backend",
  "Deixe todas mais curtas e objetivas",
]

export function SkillsAssistente({ onClose }: { onClose: () => void }) {
  const { data: skills } = useSkills()
  const { create, update } = useSkillMutations()

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      who: "ai",
      text: "Posso editar várias skills de uma vez e criar em lote. Diga o que quer (ex.: 'padronize as descrições' ou 'crie 3 skills de devops'). Vou propor ações e você aplica.",
    },
  ])
  const [draft, setDraft] = useState("")
  const [aplicadas, setAplicadas] = useState<Set<string>>(new Set())
  const [verAcao, setVerAcao] = useState<AssistenteAcao | null>(null)
  const [atual, setAtual] = useState<string | null>(null) // conteúdo atual (p/ diff em edição)
  const [carregandoAtual, setCarregandoAtual] = useState(false)
  const [pensando, setPensando] = useState(false)
  const [status, setStatus] = useState<AssistenteStatus | null>(null)
  const [segundos, setSegundos] = useState(0)
  const threadRef = useRef<HTMLDivElement>(null)
  const inicioRef = useRef(0)

  // timer ao vivo (atualiza o relógio mesmo entre eventos do servidor)
  useEffect(() => {
    if (!pensando) return
    const id = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [pensando])

  function scrollBottom() {
    setTimeout(() => {
      if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
    }, 30)
  }

  function send(text?: string) {
    const userText = (text ?? draft).trim()
    if (!userText || pensando) return
    const next: Msg[] = [...msgs, { who: "me", text: userText }]
    setMsgs(next)
    setDraft("")
    setPensando(true)
    setStatus(null)
    setSegundos(0)
    inicioRef.current = Date.now()
    scrollBottom()
    const mensagens = next.map((m) => ({ role: (m.who === "ai" ? "assistant" : "user") as "user" | "assistant", content: m.text }))
    skillsApi.assistenteStream(mensagens, {
      onStatus: (s) => {
        setStatus(s)
        // sincroniza o relógio com o tempo real do servidor
        setSegundos(Math.max(Math.round(s.elapsed), Math.round((Date.now() - inicioRef.current) / 1000)))
        scrollBottom()
      },
      onDone: (r) => {
        setPensando(false)
        setStatus(null)
        setMsgs((m) => [...m, { who: "ai", text: r.reply, acoes: r.acoes }])
        scrollBottom()
      },
      onError: (msg) => {
        setPensando(false)
        setStatus(null)
        toast.error("Não foi possível responder", msg)
      },
    })
  }

  async function aplicar(a: AssistenteAcao, key: string): Promise<boolean> {
    try {
      if (a.tipo === "criar") {
        await create.mutateAsync({ display_title: a.display_title, conteudo: a.conteudo, arquivos: a.arquivos })
      } else {
        const alvo = (skills ?? []).find((s) => s.name === a.name)
        if (!alvo) {
          toast.error("Skill não encontrada para editar", a.name)
          return false
        }
        await update.mutateAsync({ id: alvo.id, conteudo: a.conteudo, arquivos: a.arquivos })
      }
      setAplicadas((s) => new Set(s).add(key))
      return true
    } catch (e) {
      toast.error(`Erro ao ${a.tipo} ${a.name}`, e instanceof Error ? e.message : undefined)
      return false
    }
  }

  async function aplicarTodas(acoes: AssistenteAcao[], msgIdx: number) {
    let ok = 0
    for (let i = 0; i < acoes.length; i++) {
      const key = `${msgIdx}:${i}`
      if (aplicadas.has(key)) continue
      if (await aplicar(acoes[i], key)) ok++
    }
    if (ok) toast.success(`${ok} skill(s) aplicada(s)`)
  }

  async function verArquivo(a: AssistenteAcao) {
    setVerAcao(a)
    setAtual(null)
    if (a.tipo !== "editar") return
    const alvo = (skills ?? []).find((s) => s.name === a.name)
    if (!alvo) return
    setCarregandoAtual(true)
    try {
      const det = await skillsApi.get(alvo.id)
      setAtual(det.conteudo)
    } catch {
      // sem conteúdo atual: mostra só o arquivo proposto
    } finally {
      setCarregandoAtual(false)
    }
  }

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <Icon name="sparkle" size={18} style={{ color: "var(--accent)" }} />
      <h3>Assistente de Skills</h3>
    </div>
  )

  return (
    <Modal onClose={onClose} title={head} size="lg">
      <div style={{ display: "flex", flexDirection: "column", height: "66vh", margin: -18 }}>
        <div className="chat-thread" ref={threadRef}>
          {msgs.map((m, mi) => (
            <div key={mi} className={"cmsg " + (m.who === "ai" ? "ai" : "me")} style={{ maxWidth: "94%" }}>
              <div className="cav">{m.who === "ai" ? <Icon name="sparkle" size={14} /> : "EU"}</div>
              <div className="cbubble" style={{ width: "100%" }}>
                {m.text}
                {m.acoes && m.acoes.length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {m.acoes.length > 1 && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon="check"
                        onClick={() => aplicarTodas(m.acoes!, mi)}
                        disabled={create.isPending || update.isPending}
                      >
                        Aplicar todas ({m.acoes.length})
                      </Button>
                    )}
                    {m.acoes.map((a, ai) => {
                      const key = `${mi}:${ai}`
                      const feito = aplicadas.has(key)
                      return (
                        <div
                          key={ai}
                          className="card"
                          style={{ padding: "10px 12px", background: "var(--surface)" }}
                        >
                          <div className="spread" style={{ marginBottom: 4 }}>
                            <div className="row" style={{ gap: 8, minWidth: 0 }}>
                              <span className={"pill " + (a.tipo === "criar" ? "pill-done" : "pill-doing")}>
                                <span className="dot" /> {a.tipo}
                              </span>
                              <span className="truncate" style={{ fontWeight: 700 }}>
                                {a.display_title}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant={feito ? "ghost" : "primary"}
                              icon={feito ? "check" : undefined}
                              onClick={() => aplicar(a, key)}
                              disabled={feito || create.isPending || update.isPending}
                            >
                              {feito ? "Aplicada" : "Aplicar"}
                            </Button>
                          </div>
                          <div className="t-meta mono">{a.name}</div>
                          {a.descricao && (
                            <p className="muted" style={{ fontSize: 12.5, margin: "6px 0 0" }}>
                              {a.descricao}
                            </p>
                          )}
                          {a.arquivos && a.arquivos.length > 0 && (
                            <div className="t-meta" style={{ marginTop: 6 }}>
                              <Icon name="folder" size={12} /> SKILL.md + {a.arquivos.length} auxiliar(es)
                            </div>
                          )}
                          <div className="row" style={{ marginTop: 8 }}>
                            <Button size="sm" variant="ghost" icon="eye" onClick={() => verArquivo(a)}>
                              Ver arquivos
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {pensando && (
            <div className="cmsg ai">
              <div className="cav">
                <Icon name="sparkle" size={14} />
              </div>
              <div className="cbubble">
                <div className="ai-progress">
                  <div className="typing">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="ai-progress-fase">
                    {FASE_LABEL[status?.fase ?? "conectando"] ?? "Processando…"}
                  </span>
                  <span className="ai-progress-meta">
                    {segundos}s
                    {status && status.chars > 0 ? ` · ${status.chars.toLocaleString("pt-BR")} caracteres` : ""}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="csuggest">
          {SUGESTOES.map((s) => (
            <button key={s} className="csug" onClick={() => send(s)} disabled={pensando}>
              {s}
            </button>
          ))}
        </div>

        <div className="composer">
          <textarea
            value={draft}
            rows={1}
            placeholder="Peça para editar várias ou criar em lote…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button className="csend" onClick={() => send()} disabled={!draft.trim() || pensando}>
            <Icon name="send" size={17} />
          </button>
        </div>
      </div>

      {verAcao && (
        <ArquivoViewer
          acao={verAcao}
          atual={atual}
          carregando={carregandoAtual}
          onClose={() => setVerAcao(null)}
        />
      )}
    </Modal>
  )
}

function ArquivoViewer({
  acao,
  atual,
  carregando,
  onClose,
}: {
  acao: AssistenteAcao
  atual: string | null
  carregando: boolean
  onClose: () => void
}) {
  const [arqAtivo, setArqAtivo] = useState("SKILL.md")
  const [mostrarCompleto, setMostrarCompleto] = useState(acao.tipo === "criar")
  const dif = acao.tipo === "editar" && atual ? diffLinhas(atual, acao.conteudo, 400) : null
  const temDiff = dif && (dif.add.length > 0 || dif.del.length > 0)
  const auxAtivo = acao.arquivos?.find((a) => a.caminho === arqAtivo)

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
      <span className={"pill " + (acao.tipo === "criar" ? "pill-done" : "pill-doing")}>
        <span className="dot" /> {acao.tipo}
      </span>
      <span className="truncate mono" style={{ fontWeight: 700 }}>
        {acao.name}
      </span>
    </div>
  )

  return (
    <Modal onClose={onClose} title={head} size="lg">
      <div className="stack" style={{ gap: 12 }}>
        {/* abas de arquivos do bundle */}
        <div className="skill-files" style={{ padding: 0 }}>
          <button
            className={"skill-file" + (arqAtivo === "SKILL.md" ? " on" : "")}
            onClick={() => setArqAtivo("SKILL.md")}
          >
            <Icon name="folder" size={13} /> SKILL.md
          </button>
          {(acao.arquivos ?? []).map((a) => (
            <button
              key={a.caminho}
              className={"skill-file" + (arqAtivo === a.caminho ? " on" : "")}
              onClick={() => setArqAtivo(a.caminho)}
              title={a.caminho}
            >
              <Icon name="folder" size={13} /> {a.caminho}
            </button>
          ))}
        </div>

        {arqAtivo === "SKILL.md" ? (
          <>
            {acao.tipo === "editar" && carregando && <p className="muted">Carregando conteúdo atual…</p>}
            {temDiff && (
              <>
                <div className="t-meta">Mudanças propostas (SKILL.md)</div>
                <div className="cdiff">
                  {dif!.del.map((d, j) => (
                    <div key={"d" + j} className="ln del">
                      <span className="s">−</span>
                      {d}
                    </div>
                  ))}
                  {dif!.add.map((a, j) => (
                    <div key={"a" + j} className="ln add">
                      <span className="s">+</span>
                      {a}
                    </div>
                  ))}
                </div>
              </>
            )}
            {acao.tipo === "editar" && !carregando && !temDiff && atual && (
              <p className="muted">Sem diferenças de linha (mudanças podem ser de ordem/formatação).</p>
            )}
            <div className="spread">
              <span className="t-meta">SKILL.md {acao.tipo === "editar" ? "(proposto)" : ""}</span>
              {temDiff && (
                <Button size="sm" variant="ghost" onClick={() => setMostrarCompleto((v) => !v)}>
                  {mostrarCompleto ? "Ocultar arquivo" : "Ver arquivo completo"}
                </Button>
              )}
            </div>
            {mostrarCompleto && <pre className="file-view">{acao.conteudo}</pre>}
          </>
        ) : (
          <>
            <span className="t-meta mono">{arqAtivo}</span>
            <pre className="file-view">{auxAtivo?.conteudo ?? ""}</pre>
          </>
        )}
      </div>
    </Modal>
  )
}
