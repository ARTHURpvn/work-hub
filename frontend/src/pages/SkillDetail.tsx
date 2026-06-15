import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { skillsApi, type SkillArquivo, type SkillChatMsg } from "@/api/skills"
import { Icon } from "@/components/ui/Icon"
import { Button, IconButton } from "@/components/ui/kit"
import { useSkillChat, useSkillMutations } from "@/hooks/useSkills"
import { diffLinhas } from "@/lib/diff"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

const SUGESTOES = [
  "Reescrever mais curto",
  "Mover o conteúdo pesado para reference/",
  "Adicionar exemplos em examples/",
  "Melhorar a description (gatilhos)",
]

const SKILL_MD = "SKILL.md"

export function SkillDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { update, remove, chat, clearChat } = useSkillMutations()

  const { data: skill, isLoading, isError } = useQuery({
    queryKey: ["skill", id],
    queryFn: () => skillsApi.get(id!),
    enabled: !!id,
  })
  const { data: historico } = useSkillChat(id)

  const [conteudo, setConteudo] = useState("")
  const [arquivos, setArquivos] = useState<SkillArquivo[]>([])
  const [ativo, setAtivo] = useState<string>(SKILL_MD)
  const [dirty, setDirty] = useState(false)
  const [draft, setDraft] = useState("")
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skill) {
      setConteudo(skill.conteudo)
      setArquivos(skill.arquivos ?? [])
      setAtivo(SKILL_MD)
      setDirty(false)
    }
  }, [skill])

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight
  }, [historico, chat.isPending, pendingUser])

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

  const msgs = historico ?? []

  function salvar(c = conteudo, arqs = arquivos) {
    update.mutate(
      { id: id!, conteudo: c, arquivos: arqs },
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
    setDraft("")
    setPendingUser(userText)
    chat.mutate(
      { id: id!, mensagem: userText },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["skill-chat", id] })
          setPendingUser(null)
        },
        onError: (e) => {
          setPendingUser(null)
          toast.error("Não foi possível responder", e instanceof Error ? e.message : undefined)
        },
      }
    )
  }

  function aplicar(sugestaoConteudo: string | null, sugestaoArquivos: SkillArquivo[] | null) {
    const novoConteudo = sugestaoConteudo ?? conteudo
    const novosArquivos = sugestaoArquivos ?? arquivos
    update.mutate(
      { id: id!, conteudo: novoConteudo, arquivos: novosArquivos },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["skill", id] })
          setConteudo(novoConteudo)
          setArquivos(novosArquivos)
          setDirty(false)
          toast.success("Sugestão aplicada (nova versão)")
        },
        onError: (e) => toast.error("Erro ao aplicar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function limpar() {
    const ok = await confirm({
      title: "Limpar conversa?",
      description: "O histórico desta skill será apagado.",
      confirmLabel: "Limpar",
      destructive: true,
    })
    if (!ok) return
    clearChat.mutate(id!, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["skill-chat", id] }),
    })
  }

  // ----- edição multi-arquivo -----
  const valorAtivo = ativo === SKILL_MD ? conteudo : arquivos.find((a) => a.caminho === ativo)?.conteudo ?? ""

  function editarAtivo(valor: string) {
    setDirty(true)
    if (ativo === SKILL_MD) {
      setConteudo(valor)
    } else {
      setArquivos((arr) => arr.map((a) => (a.caminho === ativo ? { ...a, conteudo: valor } : a)))
    }
  }

  function adicionarArquivo() {
    let base = "reference/novo.md"
    let n = 1
    while (arquivos.some((a) => a.caminho === base)) {
      n += 1
      base = `reference/novo-${n}.md`
    }
    setArquivos((arr) => [...arr, { caminho: base, conteudo: "" }])
    setAtivo(base)
    setDirty(true)
  }

  function renomearAtivo(novo: string) {
    const limpo = novo.trim()
    setArquivos((arr) => arr.map((a) => (a.caminho === ativo ? { ...a, caminho: limpo } : a)))
    setAtivo(limpo)
    setDirty(true)
  }

  function removerAtivo() {
    setArquivos((arr) => arr.filter((a) => a.caminho !== ativo))
    setAtivo(SKILL_MD)
    setDirty(true)
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
        <Button
          variant="primary"
          size="sm"
          icon="check"
          onClick={() => salvar()}
          disabled={!dirty || update.isPending}
        >
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
              {msgs.length > 0 && (
                <IconButton name="trash" size={15} onClick={limpar} aria-label="Limpar conversa" title="Limpar conversa" />
              )}
            </div>

            <div className="chat-thread" ref={threadRef}>
              {msgs.length === 0 && !pendingUser && !chat.isPending && (
                <div className="cmsg ai">
                  <div className="cav">
                    <Icon name="sparkle" size={14} />
                  </div>
                  <div className="cbubble">
                    Posso melhorar a "{skill.display_title}" como bundle multi-arquivo (SKILL.md enxuto +
                    reference/scripts/templates) e rodar um teste mostrando a skill em ação. O que quer ajustar?
                  </div>
                </div>
              )}

              {msgs.map((m) => (
                <ChatBubble key={m.id} m={m} conteudo={conteudo} onAplicar={aplicar} aplicando={update.isPending} />
              ))}

              {pendingUser && (
                <div className="cmsg me">
                  <div className="cav">EU</div>
                  <div className="cbubble">{pendingUser}</div>
                </div>
              )}
              {chat.isPending && (
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
              )}
            </div>

            <div className="csuggest">
              {SUGESTOES.map((s) => (
                <button key={s} className="csug" onClick={() => send(s)} disabled={chat.isPending}>
                  {s}
                </button>
              ))}
            </div>

            <div className="composer">
              <textarea
                value={draft}
                rows={1}
                placeholder="Peça mudanças, tire dúvidas…"
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
              Arquivos do bundle
            </span>
            {dirty ? <span className="t-meta">não salvo</span> : null}
          </div>

          {/* abas de arquivos */}
          <div className="skill-files">
            <button
              className={"skill-file" + (ativo === SKILL_MD ? " on" : "")}
              onClick={() => setAtivo(SKILL_MD)}
            >
              <Icon name="folder" size={13} /> SKILL.md
            </button>
            {arquivos.map((a) => (
              <button
                key={a.caminho}
                className={"skill-file" + (ativo === a.caminho ? " on" : "")}
                onClick={() => setAtivo(a.caminho)}
                title={a.caminho}
              >
                <Icon name="folder" size={13} /> {a.caminho}
              </button>
            ))}
            <button className="skill-file add" onClick={adicionarArquivo} title="Adicionar arquivo auxiliar">
              <Icon name="plus" size={13} /> arquivo
            </button>
          </div>

          {/* barra de caminho/remover do arquivo auxiliar ativo */}
          {ativo !== SKILL_MD && (
            <div className="skill-file-bar">
              <input
                className="input mono"
                value={ativo}
                spellCheck={false}
                onChange={(e) => renomearAtivo(e.target.value)}
                placeholder="reference/exemplo.md"
              />
              <IconButton name="trash" size={15} onClick={removerAtivo} aria-label="Remover arquivo" title="Remover arquivo" />
            </div>
          )}

          <div className="skill-editor-area">
            <textarea
              value={valorAtivo}
              spellCheck={false}
              placeholder={ativo === SKILL_MD ? "" : "Conteúdo de " + ativo}
              onChange={(e) => editarAtivo(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatBubble({
  m,
  conteudo,
  onAplicar,
  aplicando,
}: {
  m: SkillChatMsg
  conteudo: string
  onAplicar: (sugestaoConteudo: string | null, sugestaoArquivos: SkillArquivo[] | null) => void
  aplicando: boolean
}) {
  if (m.role === "user") {
    return (
      <div className="cmsg me">
        <div className="cav">EU</div>
        <div className="cbubble">{m.content}</div>
      </div>
    )
  }
  const dif = m.sugestao_conteudo ? diffLinhas(conteudo, m.sugestao_conteudo) : null
  const temDiff = dif && (dif.add.length > 0 || dif.del.length > 0)
  const arqs = m.sugestao_arquivos ?? []
  const temSugestao = !!m.sugestao_conteudo || arqs.length > 0
  return (
    <div className="cmsg ai">
      <div className="cav">
        <Icon name="sparkle" size={14} />
      </div>
      <div className="cbubble">
        {m.content}

        {m.demonstracao && (
          <div className="demo-box">
            <div className="demo-head">
              <Icon name="check_list" size={13} /> Teste — resultado usando a skill
            </div>
            <pre className="demo-body">{m.demonstracao}</pre>
          </div>
        )}

        {temDiff && (
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
        )}

        {arqs.length > 0 && (
          <div className="t-meta" style={{ marginTop: 8 }}>
            <Icon name="folder" size={12} /> {arqs.length} arquivo(s) auxiliar(es): {arqs.map((a) => a.caminho).join(", ")}
          </div>
        )}

        {temSugestao && (
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <Button
              size="sm"
              variant="primary"
              icon="check"
              onClick={() => onAplicar(m.sugestao_conteudo, m.sugestao_arquivos)}
              disabled={aplicando}
            >
              {temDiff || arqs.length ? "Aplicar" : "Reaplicar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
