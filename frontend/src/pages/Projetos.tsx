import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { projetosApi, type Origem, type Projeto } from "@/api/projetos"
import { Icon } from "@/components/ui/Icon"
import { Drawer } from "@/components/ui/Drawer"
import { ProjetoView } from "@/components/projetos/ProjetoView"
import {
  Button,
  Empty,
  Field,
  OriginTag,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/kit"
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateProjeto, useProjetos, useUpdateProjeto } from "@/hooks/useProjetos"
import { useDeleteCredencial, useUpsertCredencial } from "@/hooks/useCredencial"
import { useDonos } from "@/hooks/useDonos"
import { useCreateVps, useVpsList } from "@/hooks/useVps"
import { toast } from "@/store/toastStore"

export function Projetos() {
  const navigate = useNavigate()
  const { data: projetos } = useProjetos()
  const { data: donos } = useDonos()

  const [filter, setFilter] = useState<"all" | Origem>("all")
  const [showArch, setShowArch] = useState(false)
  const [showIdeias, setShowIdeias] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editNew, setEditNew] = useState(false)
  const [creating, setCreating] = useState<"projeto" | "ideia" | null>(null)

  const all = projetos ?? []
  let list: Projeto[]
  if (showIdeias) {
    list = all.filter((p) => p.rascunho)
  } else {
    list = all.filter((p) => !p.rascunho && (showArch ? true : !p.arquivado))
    if (filter !== "all") list = list.filter((p) => p.origem === filter)
  }
  const open = all.find((p) => p.id === openId) ?? null

  const ativos = all.filter((p) => !p.arquivado && !p.rascunho).length
  const arquivados = all.filter((p) => p.arquivado && !p.rascunho).length
  const ideias = all.filter((p) => p.rascunho).length

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Projetos</h1>
          <div className="sub">
            {ativos} ativos · {arquivados} arquivados · {ideias} ideias
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="ghost" icon="sparkle" onClick={() => setCreating("ideia")}>
            Nova ideia
          </Button>
          <Button variant="primary" icon="plus" onClick={() => setCreating("projeto")}>
            Novo projeto
          </Button>
        </div>
      </div>

      {all.length ? (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 20 }}>
            <span
              className={"chip" + (filter === "all" && !showIdeias ? " on" : "")}
              onClick={() => {
                setFilter("all")
                setShowIdeias(false)
              }}
            >
              Todos
            </span>
            {(donos ?? []).map((o) => (
              <span
                key={o.id}
                className={"chip" + (filter === o.nome && !showIdeias ? " on" : "")}
                onClick={() => {
                  setFilter(o.nome)
                  setShowIdeias(false)
                }}
              >
                {o.nome}
              </span>
            ))}
            <span
              className={"chip" + (showIdeias ? " on" : "")}
              style={{ marginLeft: "auto" }}
              onClick={() =>
                setShowIdeias((s) => {
                  if (!s) setShowArch(false)
                  return !s
                })
              }
            >
              <Icon name="sparkle" size={13} /> Ideias
            </span>
            <span
              className={"chip" + (showArch ? " on" : "")}
              onClick={() =>
                setShowArch((s) => {
                  if (!s) setShowIdeias(false)
                  return !s
                })
              }
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
                    if (p.rascunho) {
                      navigate(`/ideias/${p.id}`)
                      return
                    }
                    setOpenId(p.id)
                    setEditNew(false)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="card card-pad">
              <Empty
                icon={showIdeias ? "sparkle" : "folder"}
                title={showIdeias ? "Nenhuma ideia ainda" : "Nenhum projeto neste filtro"}
              >
                {showIdeias ? "Guarde aqui projetos que quer fazer para não esquecer." : undefined}
              </Empty>
            </div>
          )}
        </>
      ) : (
        <div className="card card-pad">
          <Empty
            icon="folder"
            title="Nenhum projeto ainda"
            action={
              <Button variant="primary" icon="plus" onClick={() => setCreating("projeto")}>
                Criar primeiro projeto
              </Button>
            }
          >
            Projetos agrupam tarefas, credenciais e o servidor onde rodam.
          </Empty>
        </div>
      )}

      {creating && (
        <ProjetoCreateDrawer
          rascunho={creating === "ideia"}
          onClose={() => setCreating(null)}
          onCreated={(id, rascunho) => {
            setCreating(null)
            // ideia abre direto na página dedicada (brief + IA); projeto normal abre no drawer
            if (rascunho) {
              navigate(`/ideias/${id}`)
              return
            }
            setShowIdeias(false)
            setOpenId(id)
            setEditNew(false)
          }}
        />
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

function VpsSelectField({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data: vpsList } = useVpsList()
  const createVps = useCreateVps()
  const [nova, setNova] = useState(false)
  const [f, setF] = useState({ nome: "", ip: "", provedor: "" })

  function criar() {
    if (!f.ip.trim()) {
      toast.error("IP da VPS é obrigatório")
      return
    }
    createVps.mutate(
      { nome: f.nome.trim() || null, ip: f.ip.trim(), provedor: f.provedor.trim() || null },
      {
        onSuccess: (v) => {
          onChange(v.id)
          setNova(false)
          setF({ nome: "", ip: "", provedor: "" })
          toast.success("VPS criada e selecionada")
        },
        onError: (e) => toast.error("Erro ao criar VPS", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <Field label="VPS">
      <div className="row" style={{ gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Select value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">— nenhuma —</option>
            {(vpsList ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome || v.ip}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" size="sm" variant="ghost" icon={nova ? "x" : "plus"} onClick={() => setNova((n) => !n)}>
          {nova ? "Cancelar" : "Nova VPS"}
        </Button>
      </div>
      {nova && (
        <div className="card card-pad" style={{ marginTop: 8 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <TextInput value={f.nome} onChange={(e) => setF((s) => ({ ...s, nome: e.target.value }))} placeholder="Nome (opcional)" />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <TextInput value={f.ip} onChange={(e) => setF((s) => ({ ...s, ip: e.target.value }))} placeholder="IP *" />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <TextInput value={f.provedor} onChange={(e) => setF((s) => ({ ...s, provedor: e.target.value }))} placeholder="Provedor (opcional)" />
            </div>
          </div>
          <Button type="button" size="sm" variant="primary" icon="check" disabled={createVps.isPending} onClick={criar} style={{ marginTop: 8 }}>
            {createVps.isPending ? "Criando…" : "Criar e selecionar"}
          </Button>
        </div>
      )}
    </Field>
  )
}

function ProjetoCreateDrawer({
  onClose,
  onCreated,
  rascunho = false,
}: {
  onClose: () => void
  onCreated: (id: string, rascunho: boolean) => void
  rascunho?: boolean
}) {
  const createProjeto = useCreateProjeto()
  const { data: donos } = useDonos()
  const [form, setForm] = useState({
    nome: "",
    origem: "Pessoal",
    descricao: "",
    site_url: "",
    github_url: "",
    vps_id: "",
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((s) => ({ ...s, [k]: v }))

  function criar() {
    if (!form.nome.trim()) {
      toast.error(rascunho ? "Dê um nome para a ideia" : "Informe o nome do projeto")
      return
    }
    createProjeto.mutate(
      {
        nome: form.nome.trim(),
        origem: form.origem as Origem,
        descricao: form.descricao || null,
        site_url: form.site_url || null,
        github_url: form.github_url || null,
        vps_id: form.vps_id || null,
        rascunho,
      },
      {
        onSuccess: (p) => {
          toast.success(rascunho ? "Ideia salva" : "Projeto criado")
          onCreated(p.id, rascunho)
        },
        onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <Drawer
      title={rascunho ? "Nova ideia" : "Novo projeto"}
      onClose={onClose}
      footer={
        <Button variant="primary" icon="check" onClick={criar} disabled={createProjeto.isPending} style={{ marginLeft: "auto" }}>
          {createProjeto.isPending ? "Salvando…" : rascunho ? "Salvar ideia" : "Criar projeto"}
        </Button>
      }
    >
      <Field label="Nome *">
        <TextInput value={form.nome} autoFocus onChange={(e) => set("nome", e.target.value)} placeholder="Nome do projeto" />
      </Field>
      <Field label="Dono / Origem">
        <UiSelect value={form.origem} onValueChange={(v) => set("origem", v as Origem)}>
          <SelectTrigger className="h-[38px] w-full bg-[var(--bg-2)] shadow-none">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {(donos ?? []).map((o) => (
              <SelectItem key={o.id} value={o.nome}>
                {o.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </UiSelect>
      </Field>
      <Field label="Repositório GitHub">
        <TextInput value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" />
      </Field>
      <DescricaoField
        value={form.descricao}
        githubUrl={form.github_url}
        onChange={(v) => set("descricao", v)}
      />
      <Field label="Link do site">
        <TextInput value={form.site_url} onChange={(e) => set("site_url", e.target.value)} placeholder="https://" />
      </Field>
      <VpsSelectField value={form.vps_id} onChange={(id) => set("vps_id", id)} />
    </Drawer>
  )
}

/** Botão que chama a IA para gerar a descrição a partir do repositório GitHub. */
function BotaoGerarDescricao({
  githubUrl,
  onGenerated,
}: {
  githubUrl: string
  onGenerated: (texto: string) => void
}) {
  const [loading, setLoading] = useState(false)

  async function gerar() {
    const url = githubUrl.trim()
    if (!url) {
      toast.error("Informe o repositório GitHub primeiro")
      return
    }
    setLoading(true)
    try {
      const { descricao } = await projetosApi.gerarDescricao(url)
      onGenerated(descricao)
      toast.success("Descrição gerada pela IA")
    } catch (e) {
      toast.error("Não foi possível gerar", e instanceof Error ? e.message : undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" icon="sparkle" disabled={loading} onClick={gerar}>
      {loading ? "Gerando…" : "Gerar com IA"}
    </Button>
  )
}

/** Campo de descrição com botão de geração por IA ao lado do rótulo. Usado no criar e no editar. */
function DescricaoField({
  value,
  githubUrl,
  onChange,
}: {
  value: string
  githubUrl: string
  onChange: (v: string) => void
}) {
  return (
    <Field label="Descrição" action={<BotaoGerarDescricao githubUrl={githubUrl} onGenerated={onChange} />}>
      <TextArea value={value} onChange={(e) => onChange(e.target.value)} placeholder="O que é este projeto?" />
    </Field>
  )
}

function ProjectCard({ p, onOpen }: { p: Projeto; onOpen: () => void }) {
  return (
    <div className="card card-pad card-hover" onClick={onOpen}>
      <div className="spread" style={{ marginBottom: 12 }}>
        <OriginTag origin={p.origem} />
        {p.rascunho ? (
          <span className="chip static">
            <Icon name="sparkle" size={13} /> Ideia
          </span>
        ) : p.arquivado ? (
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
  const { data: donos } = useDonos()
  const update = useUpdateProjeto()
  const upsertCred = useUpsertCredencial()
  const delCred = useDeleteCredencial()

  const [edit, setEdit] = useState(startEdit)
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

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <OriginTag origin={projeto.origem} />
      <span style={{ fontWeight: 700, fontSize: 15 }} className="truncate">
        {projeto.nome || "(sem nome)"}
      </span>
      {projeto.rascunho && (
        <span className="chip static">
          <Icon name="sparkle" size={12} /> Ideia
        </span>
      )}
    </div>
  )

  const footer = edit ? (
    <>
      <Button variant="primary" icon="check" onClick={save} disabled={update.isPending} style={{ marginLeft: "auto" }}>
        Salvar
      </Button>
    </>
  ) : projeto.rascunho ? (
    <>
      <Button
        icon="check"
        onClick={() =>
          update.mutate(
            { id: projeto.id, data: { rascunho: false } },
            { onSuccess: () => toast.success("Ideia promovida para projeto ativo") }
          )
        }
        disabled={update.isPending}
        style={{ marginRight: "auto" }}
      >
        Promover para ativo
      </Button>
      <Button variant="primary" icon="edit" onClick={() => setEdit(true)}>
        Editar
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
            <UiSelect value={form.origem} onValueChange={(v) => set("origem", v as Origem)}>
              <SelectTrigger className="h-[38px] w-full bg-[var(--bg-2)] shadow-none">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(donos ?? []).map((o) => (
                  <SelectItem key={o.id} value={o.nome}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </UiSelect>
          </Field>
          <Field label="Repositório GitHub">
            <TextInput value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" />
          </Field>
          <DescricaoField
            value={form.descricao}
            githubUrl={form.github_url}
            onChange={(v) => set("descricao", v)}
          />
          <Field label="Link do site">
            <TextInput value={form.site_url} onChange={(e) => set("site_url", e.target.value)} placeholder="https://" />
          </Field>
          <VpsSelectField value={form.vps_id} onChange={(id) => set("vps_id", id)} />
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
        <ProjetoView projeto={projeto} onEdit={() => setEdit(true)} />
      )}
    </Drawer>
  )
}
