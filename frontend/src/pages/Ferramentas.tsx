import { useState } from "react"
import { ferramentasApi, type CredTipo, type Ferramenta } from "@/api/ferramentas"
import { Drawer } from "@/components/ui/Drawer"
import { Icon } from "@/components/ui/Icon"
import { Button, Empty, Field, OriginTag, TextArea, TextInput } from "@/components/ui/kit"
import { useDonos } from "@/hooks/useDonos"
import { useFerramentaMutations, useFerramentas } from "@/hooks/useFerramentas"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Ferramentas() {
  const { data: ferramentas, isLoading, isError } = useFerramentas()
  const [editor, setEditor] = useState<Ferramenta | "novo" | null>(null)

  const all = ferramentas ?? []

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Ferramentas</h1>
          <div className="sub">{all.length} ferramentas · quais times usam e onde obter a credencial</div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>
          Nova ferramenta
        </Button>
      </div>

      {isError && <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Erro ao carregar ferramentas.</div>}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty
            icon="key"
            title="Nenhuma ferramenta ainda"
            action={<Button variant="primary" icon="plus" onClick={() => setEditor("novo")}>Cadastrar ferramenta</Button>}
          >
            Registre as ferramentas de cada time e onde obter (ou guarde cifrada) a credencial.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((f) => (
            <div key={f.id} className="card card-pad card-hover" onClick={() => setEditor(f)}>
              <div className="spread" style={{ marginBottom: 10 }}>
                <span className="truncate" style={{ fontWeight: 700 }}>{f.nome}</span>
                {f.tem_credencial && <Icon name="lock" size={14} style={{ color: "var(--accent)" }} />}
              </div>
              <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>
                {f.times.length ? f.times.map((t) => <OriginTag key={t} origin={t} />) : <span className="muted" style={{ fontSize: 12 }}>sem time</span>}
                {f.site_url && (
                  <a
                    href={f.site_url}
                    target="_blank"
                    rel="noreferrer"
                    className="tag"
                    style={{ textDecoration: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon name="external" size={12} /> Abrir site
                  </a>
                )}
              </div>
              {f.onde_obter && (
                <div className="sub" style={{ margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
                  {f.onde_obter}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editor && <FerramentaEditor ferramenta={editor === "novo" ? null : editor} onClose={() => setEditor(null)} />}
    </div>
  )
}

function FerramentaEditor({ ferramenta, onClose }: { ferramenta: Ferramenta | null; onClose: () => void }) {
  const { data: donos } = useDonos()
  const { create, update, remove } = useFerramentaMutations()
  const editing = !!ferramenta

  const [nome, setNome] = useState(ferramenta?.nome ?? "")
  const [times, setTimes] = useState<Set<string>>(new Set(ferramenta?.times ?? []))
  const [descricao, setDescricao] = useState(ferramenta?.descricao ?? "")
  const [siteUrl, setSiteUrl] = useState(ferramenta?.site_url ?? "")
  const [ondeObter, setOndeObter] = useState(ferramenta?.onde_obter ?? "")
  const [credTipo, setCredTipo] = useState<CredTipo>(ferramenta?.cred_tipo ?? "valor")
  const [credEmail, setCredEmail] = useState(ferramenta?.cred_email ?? "")
  const [credencial, setCredencial] = useState("")
  const [credDirty, setCredDirty] = useState(false)

  const toggleTime = (t: string) =>
    setTimes((s) => {
      const n = new Set(s)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })

  async function revelar() {
    if (!ferramenta) return
    try {
      const { credencial: v } = await ferramentasApi.revelar(ferramenta.id)
      setCredencial(v)
      setCredDirty(true)
      toast.success("Credencial revelada")
    } catch (e) {
      toast.error("Sem credencial ou erro", e instanceof Error ? e.message : undefined)
    }
  }

  function salvar() {
    if (!nome.trim()) {
      toast.error("Informe o nome da ferramenta")
      return
    }
    const body = {
      nome: nome.trim(),
      times: [...times],
      descricao: descricao || null,
      site_url: siteUrl.trim() || null,
      onde_obter: ondeObter || null,
      cred_tipo: credTipo,
      cred_email: credTipo === "email_senha" ? credEmail.trim() || null : null,
      ...(credDirty ? { credencial } : {}),
    }
    const onSuccess = () => {
      toast.success("Ferramenta salva")
      onClose()
    }
    const onError = (e: unknown) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined)
    if (editing && ferramenta) update.mutate({ id: ferramenta.id, body }, { onSuccess, onError })
    else create.mutate(body, { onSuccess, onError })
  }

  async function excluir() {
    if (!ferramenta) return
    const ok = await confirm({ title: `Excluir "${ferramenta.nome}"?`, confirmLabel: "Excluir", destructive: true })
    if (!ok) return
    remove.mutate(ferramenta.id, {
      onSuccess: () => {
        toast.success("Ferramenta excluída")
        onClose()
      },
    })
  }

  const saving = create.isPending || update.isPending

  return (
    <Drawer
      title={editing ? "Editar ferramenta" : "Nova ferramenta"}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <Button variant="danger" icon="trash" onClick={excluir} style={{ marginRight: "auto" }}>
              Excluir
            </Button>
          )}
          <Button variant="primary" icon="check" onClick={salvar} disabled={saving} style={{ marginLeft: editing ? undefined : "auto" }}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <Field label="Nome *">
        <TextInput value={nome} autoFocus onChange={(e) => setNome(e.target.value)} placeholder="Ex.: RedTrack, Meta Ads…" />
      </Field>

      <Field label="Link do site" hint="Abre direto no site da ferramenta.">
        <TextInput value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} placeholder="https://app.redtrack.io" />
      </Field>

      <Field label="Times que usam">
        <div className="row wrap" style={{ gap: 6 }}>
          {(donos ?? []).map((d) => (
            <span key={d.id} className={"chip" + (times.has(d.nome) ? " on" : "")} onClick={() => toggleTime(d.nome)}>
              {d.nome}
            </span>
          ))}
        </div>
      </Field>

      <Field label="Descrição">
        <TextArea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Pra que serve" />
      </Field>

      <Field label="Onde obter a credencial" hint="Link ou instruções de onde pegar o acesso.">
        <TextArea value={ondeObter} onChange={(e) => setOndeObter(e.target.value)} placeholder="Ex.: painel admin > API keys, ou peça pro João" />
      </Field>

      <Field label="Credencial">
        <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>
          <span className={"chip" + (credTipo === "valor" ? " on" : "")} onClick={() => setCredTipo("valor")}>
            Valor único
          </span>
          <span className={"chip" + (credTipo === "email_senha" ? " on" : "")} onClick={() => setCredTipo("email_senha")}>
            Email + senha
          </span>
        </div>
        {credTipo === "email_senha" && (
          <div style={{ marginBottom: 8 }}>
            <TextInput value={credEmail} onChange={(e) => setCredEmail(e.target.value)} placeholder="email / login (em claro)" />
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <div style={{ flex: 1 }}>
            <TextInput
              type="password"
              value={credencial}
              onChange={(e) => {
                setCredencial(e.target.value)
                setCredDirty(true)
              }}
              placeholder={
                editing && ferramenta?.tem_credencial
                  ? "•••• (mantém a atual)"
                  : credTipo === "email_senha"
                    ? "senha"
                    : "valor da credencial"
              }
            />
          </div>
          {editing && ferramenta?.tem_credencial && (
            <Button type="button" size="sm" variant="ghost" icon="eye" onClick={revelar}>
              Revelar
            </Button>
          )}
        </div>
        <span className="hint">
          {credTipo === "email_senha" ? "Email em claro; senha cifrada (Fernet)." : "Cifrada com Fernet."}
          {editing && ferramenta?.tem_credencial ? " Em branco mantém a atual." : ""}
        </span>
        {editing && ferramenta?.tem_credencial && (
          <button
            type="button"
            className="linklike"
            style={{ marginTop: 6, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 }}
            onClick={() => {
              setCredencial("")
              setCredDirty(true)
              toast.success("Credencial será removida ao salvar")
            }}
          >
            Remover credencial ao salvar
          </button>
        )}
      </Field>
    </Drawer>
  )
}
