import { useState } from "react"
import { projetosApi, type Origem, type Projeto } from "@/api/projetos"
import { Icon } from "@/components/ui/Icon"
import { Drawer } from "@/components/ui/Drawer"
import {
  Button,
  Empty,
  Field,
  IconButton,
  OriginTag,
  Progress,
  Select,
  StatusPill,
  TextArea,
  TextInput,
} from "@/components/ui/kit"
import { isLate, ORIGENS } from "@/lib/domain"
import { copyText } from "@/lib/utils"
import { useTaskModalStore } from "@/store/taskModalStore"
import { useCreateProjeto, useProjetos, useUpdateProjeto } from "@/hooks/useProjetos"
import { useDeleteCredencial, useUpsertCredencial } from "@/hooks/useCredencial"
import { useCreateTarefa, useTarefas } from "@/hooks/useTarefas"
import { useCreateVps, useVpsList } from "@/hooks/useVps"
import { toast } from "@/store/toastStore"

export function Projetos() {
  const { data: projetos } = useProjetos()
  const createProjeto = useCreateProjeto()

  const [filter, setFilter] = useState<"all" | Origem>("all")
  const [showArch, setShowArch] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editNew, setEditNew] = useState(false)

  const all = projetos ?? []
  let list = all.filter((p) => (showArch ? true : !p.arquivado))
  if (filter !== "all") list = list.filter((p) => p.origem === filter)
  const open = all.find((p) => p.id === openId) ?? null

  function create() {
    createProjeto.mutate(
      { nome: "Novo projeto", origem: "Pessoal" },
      {
        onSuccess: (p) => {
          setOpenId(p.id)
          setEditNew(true)
        },
        onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  const ativos = all.filter((p) => !p.arquivado).length
  const arquivados = all.filter((p) => p.arquivado).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Projetos</h1>
          <div className="sub">
            {ativos} ativos · {arquivados} arquivados
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={create}>
          Novo projeto
        </Button>
      </div>

      {all.length ? (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 20 }}>
            <span className={"chip" + (filter === "all" ? " on" : "")} onClick={() => setFilter("all")}>
              Todos
            </span>
            {ORIGENS.map((o) => (
              <span key={o.id} className={"chip" + (filter === o.id ? " on" : "")} onClick={() => setFilter(o.id)}>
                {o.label}
              </span>
            ))}
            <span
              className={"chip" + (showArch ? " on" : "")}
              style={{ marginLeft: "auto" }}
              onClick={() => setShowArch((s) => !s)}
            >
              <Icon name="archive" size={13} /> Arquivados
            </span>
          </div>

          {list.length ? (
            <div className="grid g-3">
              {list.map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  onOpen={() => {
                    setOpenId(p.id)
                    setEditNew(false)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card card-pad">
              <Empty icon="folder" title="Nenhum projeto neste filtro" />
            </div>
          )}
        </>
      ) : (
        <div className="card card-pad">
          <Empty
            icon="folder"
            title="Nenhum projeto ainda"
            action={
              <Button variant="primary" icon="plus" onClick={create}>
                Criar primeiro projeto
              </Button>
            }
          >
            Projetos agrupam tarefas, credenciais e o servidor onde rodam.
          </Empty>
        </div>
      )}

      {open && (
        <ProjetoDrawer
          projeto={open}
          startEdit={editNew}
          onClose={() => {
            setOpenId(null)
            setEditNew(false)
          }}
        />
      )}
    </div>
  )
}

function ProjectCard({ p, onOpen }: { p: Projeto; onOpen: () => void }) {
  const { data: tarefas } = useTarefas()
  const pt = (tarefas ?? []).filter((t) => t.projeto_id === p.id)
  const done = pt.filter((t) => t.status === "Concluido").length
  const pct = pt.length ? Math.round((done / pt.length) * 100) : 0

  return (
    <div className="card card-pad card-hover" onClick={onOpen}>
      <div className="spread" style={{ marginBottom: 12 }}>
        <OriginTag origin={p.origem} />
        {p.arquivado ? (
          <span className="chip static">
            <Icon name="archive" size={13} /> Arquivado
          </span>
        ) : null}
      </div>
      <h3 className="t-h2" style={{ marginBottom: 6 }}>
        {p.nome || "(sem nome)"}
      </h3>
      <p
        className="muted"
        style={{
          fontSize: 13.5,
          margin: "0 0 14px",
          minHeight: 38,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {p.descricao || "Sem descrição."}
      </p>
      <div style={{ marginBottom: 12 }}>
        <div className="spread" style={{ marginBottom: 6 }}>
          <span className="t-meta">
            {done}/{pt.length} tarefas
          </span>
          <span className="t-meta mono">{pct}%</span>
        </div>
        <Progress pct={pct} />
      </div>
      <div className="row wrap" style={{ gap: 7 }}>
        {p.site_url && (
          <a
            className="chip"
            href={p.site_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={p.site_url}
            style={{ textDecoration: "none" }}
          >
            <Icon name="external" size={13} /> Site
          </a>
        )}
        {p.github_url && (
          <a
            className="chip"
            href={p.github_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={p.github_url}
            style={{ textDecoration: "none" }}
          >
            <Icon name="external" size={13} /> GitHub
          </a>
        )}
        {p.tem_credencial && (
          <span className="chip static">
            <Icon name="lock" size={13} /> cred
          </span>
        )}
        {p.vps && (
          <span className="chip static" style={{ marginLeft: "auto" }}>
            <Icon name="server" size={13} /> {p.vps.nome || p.vps.ip}
          </span>
        )}
      </div>
    </div>
  )
}

function ProjetoDrawer({ projeto, startEdit, onClose }: { projeto: Projeto; startEdit: boolean; onClose: () => void }) {
  const { data: tarefas } = useTarefas()
  const { data: vpsList } = useVpsList()
  const createVps = useCreateVps()
  const update = useUpdateProjeto()
  const upsertCred = useUpsertCredencial()
  const delCred = useDeleteCredencial()
  const createTarefa = useCreateTarefa()
  const openTask = useTaskModalStore((s) => s.open)

  const [edit, setEdit] = useState(startEdit)
  const [reveal, setReveal] = useState<{ usuario: string; senha: string } | null>(null)
  const [form, setForm] = useState({
    nome: projeto.nome,
    origem: projeto.origem,
    descricao: projeto.descricao ?? "",
    site_url: projeto.site_url ?? "",
    github_url: projeto.github_url ?? "",
    vps_id: projeto.vps_id ?? "",
    credUser: "",
    credPass: "",
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const [novaVps, setNovaVps] = useState(false)
  const [vpsForm, setVpsForm] = useState({ nome: "", ip: "", provedor: "" })

  function criarVps() {
    if (!vpsForm.ip.trim()) {
      toast.error("IP da VPS é obrigatório")
      return
    }
    createVps.mutate(
      { nome: vpsForm.nome.trim() || null, ip: vpsForm.ip.trim(), provedor: vpsForm.provedor.trim() || null },
      {
        onSuccess: (v) => {
          set("vps_id", v.id)
          setNovaVps(false)
          setVpsForm({ nome: "", ip: "", provedor: "" })
          toast.success("VPS criada e selecionada")
        },
        onError: (e) => toast.error("Erro ao criar VPS", e instanceof Error ? e.message : undefined),
      }
    )
  }

  const projTasks = (tarefas ?? []).filter((t) => t.projeto_id === projeto.id)

  function save() {
    update.mutate(
      {
        id: projeto.id,
        data: {
          nome: form.nome,
          origem: form.origem,
          descricao: form.descricao || null,
          site_url: form.site_url || null,
          github_url: form.github_url || null,
          vps_id: form.vps_id || null,
        },
      },
      {
        onSuccess: () => {
          if (form.credUser && form.credPass) {
            upsertCred.mutate({ id: projeto.id, usuario: form.credUser, senha: form.credPass })
          }
          setEdit(false)
          toast.success("Projeto salvo")
        },
        onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function doReveal() {
    if (reveal) {
      setReveal(null)
      return
    }
    try {
      const cred = await projetosApi.revelarCredencial(projeto.id)
      setReveal(cred)
    } catch (e) {
      toast.error("Erro ao revelar", e instanceof Error ? e.message : undefined)
    }
  }

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <OriginTag origin={projeto.origem} />
      <span style={{ fontWeight: 700, fontSize: 15 }} className="truncate">
        {projeto.nome || "(sem nome)"}
      </span>
    </div>
  )

  const footer = edit ? (
    <>
      <Button variant="primary" icon="check" onClick={save} disabled={update.isPending} style={{ marginLeft: "auto" }}>
        Salvar
      </Button>
    </>
  ) : (
    <>
      <Button
        icon="archive"
        onClick={() => update.mutate({ id: projeto.id, data: { arquivado: !projeto.arquivado } })}
        style={{ marginRight: "auto" }}
      >
        {projeto.arquivado ? "Desarquivar" : "Arquivar"}
      </Button>
      <Button variant="primary" icon="edit" onClick={() => setEdit(true)}>
        Editar
      </Button>
    </>
  )

  return (
    <Drawer title={head} onClose={onClose} footer={footer}>
      {edit ? (
        <div>
          <Field label="Nome">
            <TextInput value={form.nome} autoFocus onChange={(e) => set("nome", e.target.value)} placeholder="Nome do projeto" />
          </Field>
          <Field label="Dono / Origem">
            <Select value={form.origem} onChange={(e) => set("origem", e.target.value as Origem)}>
              {ORIGENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Descrição">
            <TextArea value={form.descricao} onChange={(e) => set("descricao", e.target.value)} placeholder="O que é este projeto?" />
          </Field>
          <Field label="Link do site">
            <TextInput value={form.site_url} onChange={(e) => set("site_url", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Repositório GitHub">
            <TextInput value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" />
          </Field>
          <Field label="VPS">
            <div className="row" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Select value={form.vps_id} onChange={(e) => set("vps_id", e.target.value)}>
                  <option value="">— nenhuma —</option>
                  {(vpsList ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome || v.ip}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={novaVps ? "x" : "plus"}
                onClick={() => setNovaVps((n) => !n)}
              >
                {novaVps ? "Cancelar" : "Nova VPS"}
              </Button>
            </div>
            {novaVps && (
              <div className="card card-pad" style={{ marginTop: 8 }}>
                <div className="row wrap" style={{ gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <TextInput value={vpsForm.nome} onChange={(e) => setVpsForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome (opcional)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <TextInput value={vpsForm.ip} onChange={(e) => setVpsForm((f) => ({ ...f, ip: e.target.value }))} placeholder="IP *" />
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <TextInput value={vpsForm.provedor} onChange={(e) => setVpsForm((f) => ({ ...f, provedor: e.target.value }))} placeholder="Provedor (opcional)" />
                  </div>
                </div>
                <Button type="button" size="sm" variant="primary" icon="check" disabled={createVps.isPending} onClick={criarVps} style={{ marginTop: 8 }}>
                  {createVps.isPending ? "Criando…" : "Criar e selecionar"}
                </Button>
              </div>
            )}
          </Field>
          <div className="grid g-2" style={{ gap: 12 }}>
            <Field label="Usuário (credencial)">
              <TextInput value={form.credUser} onChange={(e) => set("credUser", e.target.value)} placeholder="admin" />
            </Field>
            <Field label="Senha (credencial)" hint="Cifrada no servidor.">
              <TextInput
                type="password"
                value={form.credPass}
                onChange={(e) => set("credPass", e.target.value)}
                placeholder="••••"
              />
            </Field>
          </div>
          {projeto.tem_credencial && (
            <Button variant="danger" size="sm" icon="trash" onClick={() => delCred.mutate(projeto.id)}>
              Remover credencial salva
            </Button>
          )}
        </div>
      ) : (
        <div>
          {projeto.descricao && (
            <div className="det-block">
              <span className="t-label">Descrição</span>
              <p style={{ margin: "8px 0 0", lineHeight: 1.55 }}>{projeto.descricao}</p>
            </div>
          )}
          <div className="det-block">
            <span className="t-label">Links</span>
            <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
              {projeto.site_url && (
                <a className="det-link" href={projeto.site_url} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} /> Site
                </a>
              )}
              {projeto.github_url && (
                <a className="det-link" href={projeto.github_url} target="_blank" rel="noreferrer">
                  <Icon name="external" size={14} /> GitHub
                </a>
              )}
              {!projeto.site_url && !projeto.github_url && (
                <button className="det-link" onClick={() => setEdit(true)} style={{ cursor: "pointer" }}>
                  <Icon name="plus" size={14} /> Adicionar site / GitHub
                </button>
              )}
            </div>
          </div>
          {projeto.tem_credencial && (
            <div className="det-block">
              <span className="t-label">Credencial</span>
              <div
                className="card"
                style={{ padding: "10px 13px", marginTop: 8, display: "flex", alignItems: "center", gap: 10, background: "var(--bg-2)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontSize: 13 }}>
                    {reveal ? reveal.usuario : "•••••"}
                  </div>
                  <div className="mono" style={{ letterSpacing: reveal ? 0 : 2 }}>
                    {reveal ? reveal.senha : "••••••••"}
                  </div>
                </div>
                <IconButton name={reveal ? "eyeoff" : "eye"} size={17} onClick={doReveal} />
              </div>
            </div>
          )}
          <div className="det-block">
            <span className="t-label">VPS</span>
            <div style={{ marginTop: 8 }}>
              {projeto.vps ? (
                <button
                  className="chip"
                  title={`Copiar: ssh root@${projeto.vps.ip}`}
                  onClick={async () => {
                    const cmd = `ssh root@${projeto.vps!.ip}`
                    const ok = await copyText(cmd)
                    if (ok) toast.success("Copiado", cmd)
                    else toast.error("Não foi possível copiar", cmd)
                  }}
                >
                  <Icon name="server" size={14} /> {projeto.vps.nome || projeto.vps.ip}
                  <Icon name="copy" size={13} />
                </button>
              ) : (
                <span className="muted" style={{ fontSize: 13.5 }}>
                  Sem servidor vinculado
                </span>
              )}
            </div>
            {projeto.vps && (
              <div className="t-meta mono" style={{ marginTop: 6 }}>
                ssh root@{projeto.vps.ip}
              </div>
            )}
          </div>
          <div className="det-block" style={{ marginBottom: 0 }}>
            <div className="spread" style={{ marginBottom: 8 }}>
              <span className="t-label">Tarefas ({projTasks.length})</span>
              <Button
                size="sm"
                icon="plus"
                onClick={() =>
                  createTarefa.mutate(
                    { titulo: "Nova tarefa", projeto_id: projeto.id },
                    {
                      onSuccess: (t) => {
                        toast.success("Tarefa criada")
                        openTask(t.id)
                      },
                    }
                  )
                }
              >
                Add
              </Button>
            </div>
            {projTasks.length ? (
              projTasks.map((t) => (
                <div key={t.id} className="lrow click" style={{ padding: "9px 4px" }} onClick={() => openTask(t.id)}>
                  <StatusPill status={t.status} late={isLate(t)} />
                  <span style={{ flex: 1, fontWeight: 600 }} className="truncate">
                    {t.titulo}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                Nenhuma tarefa ainda.
              </p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  )
}
