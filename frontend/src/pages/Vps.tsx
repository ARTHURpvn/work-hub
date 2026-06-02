import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { VpsComProjetos } from "@/api/vps"
import { Icon } from "@/components/ui/Icon"
import { Drawer } from "@/components/ui/Drawer"
import { Button, Empty, Field, OriginTag, TextInput } from "@/components/ui/kit"
import { useCreateVps, useDeleteVps, useUpdateVps, useVpsList } from "@/hooks/useVps"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Vps() {
  const { data: vps } = useVpsList()
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const all = vps ?? []
  const open = all.find((v) => v.id === openId) ?? null
  const totalLinked = all.reduce((acc, v) => acc + v.projetos.length, 0)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">VPS · Servidores</h1>
          <div className="sub">
            {all.length} servidores · {totalLinked} projetos vinculados
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
          Novo servidor
        </Button>
      </div>

      {all.length ? (
        <div className="grid g-3">
          {all.map((v) => (
            <div key={v.id} className="card card-pad card-hover" onClick={() => setOpenId(v.id)}>
              <div className="spread" style={{ marginBottom: 12 }}>
                <div className="row" style={{ gap: 10 }}>
                  <div className="avatar" style={{ borderRadius: 8 }}>
                    <Icon name="server" size={16} />
                  </div>
                  <h3 className="t-h2">{v.nome || "(sem nome)"}</h3>
                </div>
              </div>
              <div className="t-meta mono" style={{ marginBottom: 12 }}>
                {v.ip || "sem host"}
                {v.provedor ? " · " + v.provedor : ""}
              </div>
              <div className="row wrap" style={{ gap: 7 }}>
                {v.projetos.length ? (
                  v.projetos.slice(0, 4).map((p) => <OriginTag key={p.id} origin={p.origem} />)
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>
                    Nenhum projeto
                  </span>
                )}
                {v.projetos.length > 4 ? <span className="chip static">+{v.projetos.length - 4}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card card-pad">
          <Empty
            icon="server"
            title="Nenhuma VPS cadastrada"
            action={
              <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
                Cadastrar servidor
              </Button>
            }
          >
            Cadastre seus servidores e veja quais projetos rodam em cada um.
          </Empty>
        </div>
      )}

      {creating && <VpsCreateDrawer onClose={() => setCreating(false)} />}
      {open && <VpsDrawer server={open} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function VpsCreateDrawer({ onClose }: { onClose: () => void }) {
  const create = useCreateVps()
  const [form, setForm] = useState({ nome: "", ip: "", provedor: "" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function save() {
    if (!form.ip.trim()) {
      toast.error("Informe o IP / host")
      return
    }
    create.mutate(
      { nome: form.nome || null, ip: form.ip.trim(), provedor: form.provedor || null },
      {
        onSuccess: () => {
          toast.success("Servidor criado")
          onClose()
        },
        onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  return (
    <Drawer
      title="Novo servidor"
      onClose={onClose}
      footer={
        <Button variant="primary" icon="check" onClick={save} disabled={create.isPending} style={{ marginLeft: "auto" }}>
          Criar
        </Button>
      }
    >
      <Field label="Nome">
        <TextInput value={form.nome} autoFocus onChange={(e) => set("nome", e.target.value)} placeholder="srv-…" />
      </Field>
      <div className="grid g-2" style={{ gap: 12 }}>
        <Field label="IP / Host">
          <TextInput value={form.ip} onChange={(e) => set("ip", e.target.value)} placeholder="203.0.113.10" />
        </Field>
        <Field label="Provedor">
          <TextInput value={form.provedor} onChange={(e) => set("provedor", e.target.value)} placeholder="Hetzner, DO…" />
        </Field>
      </div>
    </Drawer>
  )
}

function VpsDrawer({ server, onClose }: { server: VpsComProjetos; onClose: () => void }) {
  const navigate = useNavigate()
  const update = useUpdateVps()
  const del = useDeleteVps()
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ nome: server.nome ?? "", ip: server.ip, provedor: server.provedor ?? "" })
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function save() {
    update.mutate(
      { id: server.id, data: { nome: form.nome || null, ip: form.ip, provedor: form.provedor || null } },
      {
        onSuccess: () => {
          setEdit(false)
          toast.success("Servidor salvo")
        },
        onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function handleDelete() {
    const ok = await confirm({
      title: "Excluir servidor",
      description: "Os projetos vinculados perderão a referência a esta VPS.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    del.mutate(server.id, {
      onSuccess: () => {
        toast.success("Servidor excluído")
        onClose()
      },
    })
  }

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <div className="avatar" style={{ borderRadius: 8 }}>
        <Icon name="server" size={15} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 15 }} className="truncate">
        {server.nome || "(sem nome)"}
      </span>
    </div>
  )

  const footer = edit ? (
    <>
      <Button variant="danger" icon="trash" onClick={handleDelete} style={{ marginRight: "auto" }}>
        Excluir
      </Button>
      <Button variant="primary" icon="check" onClick={save} disabled={update.isPending}>
        Salvar
      </Button>
    </>
  ) : (
    <Button variant="primary" icon="edit" onClick={() => setEdit(true)} style={{ marginLeft: "auto" }}>
      Editar
    </Button>
  )

  return (
    <Drawer title={head} onClose={onClose} footer={footer}>
      {edit ? (
        <div>
          <Field label="Nome">
            <TextInput value={form.nome} autoFocus onChange={(e) => set("nome", e.target.value)} placeholder="srv-…" />
          </Field>
          <div className="grid g-2" style={{ gap: 12 }}>
            <Field label="IP / Host">
              <TextInput value={form.ip} onChange={(e) => set("ip", e.target.value)} placeholder="203.0.113.10" />
            </Field>
            <Field label="Provedor">
              <TextInput value={form.provedor} onChange={(e) => set("provedor", e.target.value)} placeholder="Hetzner, DO…" />
            </Field>
          </div>
        </div>
      ) : (
        <div>
          <div className="det-block">
            <div className="grid g-2" style={{ gap: 12 }}>
              <div>
                <span className="t-label">IP / Host</span>
                <div className="mono" style={{ marginTop: 5 }}>
                  {server.ip || "—"}
                </div>
              </div>
              <div>
                <span className="t-label">Provedor</span>
                <div style={{ marginTop: 5 }}>{server.provedor || "—"}</div>
              </div>
            </div>
          </div>
          <div className="det-block" style={{ marginBottom: 0 }}>
            <span className="t-label">Projetos rodando aqui ({server.projetos.length})</span>
            <div style={{ marginTop: 8 }}>
              {server.projetos.length ? (
                server.projetos.map((p) => (
                  <div key={p.id} className="lrow click" style={{ padding: "9px 4px" }} onClick={() => navigate("/projetos")}>
                    <OriginTag origin={p.origem} />
                    <span style={{ flex: 1, fontWeight: 600 }} className="truncate">
                      {p.nome}
                    </span>
                    {p.github_url && <Icon name="external" size={15} style={{ color: "var(--muted)" }} />}
                  </div>
                ))
              ) : (
                <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>
                  Nenhum projeto vinculado. Vincule pelo cadastro do projeto.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Drawer>
  )
}
