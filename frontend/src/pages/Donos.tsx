import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { Dono } from "@/api/donos"
import { Drawer } from "@/components/ui/Drawer"
import { Icon } from "@/components/ui/Icon"
import { Button, Empty, Field, OriginTag, TextInput } from "@/components/ui/kit"
import { useDonoMutations, useDonos } from "@/hooks/useDonos"
import { useProjetos } from "@/hooks/useProjetos"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Donos() {
  const { data: donos, isLoading, isError } = useDonos()
  const { create } = useDonoMutations()
  const [novo, setNovo] = useState("")
  const [openNome, setOpenNome] = useState<string | null>(null)

  const all = donos ?? []
  const open = all.find((d) => d.nome === openNome) ?? null

  function criar() {
    const nome = novo.trim()
    if (!nome) return
    create.mutate(nome, {
      onSuccess: () => {
        setNovo("")
        toast.success("Dono criado")
      },
      onError: (e) => toast.error("Erro ao criar", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Donos · Origens</h1>
          <div className="sub">{all.length} donos · projetos e VPS por responsável</div>
        </div>
      </div>

      <form
        className="row wrap"
        style={{ gap: 8, marginBottom: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          criar()
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <TextInput value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nome do novo dono (ex.: Evolution)…" />
        </div>
        <Button type="submit" variant="primary" icon="plus" disabled={create.isPending}>
          Novo dono
        </Button>
      </form>

      {isError && <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Erro ao carregar donos.</div>}
      {isLoading && <p className="muted">Carregando…</p>}

      {!isLoading && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty icon="user" title="Nenhum dono ainda">Crie um dono pra agrupar projetos e VPS por responsável.</Empty>
        </div>
      )}

      {all.length > 0 && (
        <div className="grid g-3">
          {all.map((d) => (
            <div key={d.id} className="card card-pad card-hover" onClick={() => setOpenNome(d.nome)}>
              <div className="spread" style={{ marginBottom: 12 }}>
                <OriginTag origin={d.nome} />
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div>
                  <div className="t-display" style={{ fontSize: 24 }}>{d.projetos_count}</div>
                  <span className="t-meta">projetos</span>
                </div>
                <div>
                  <div className="t-display" style={{ fontSize: 24 }}>{d.vps_count}</div>
                  <span className="t-meta">VPS</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <DonoDrawer dono={open} onClose={() => setOpenNome(null)} />}
    </div>
  )
}

function DonoDrawer({ dono, onClose }: { dono: Dono; onClose: () => void }) {
  const navigate = useNavigate()
  const { remove } = useDonoMutations()
  const { data: projetos } = useProjetos()

  const meus = (projetos ?? []).filter((p) => p.origem === dono.nome)
  const vpsMap = new Map<string, { id: string; nome: string | null; ip: string }>()
  for (const p of meus) if (p.vps) vpsMap.set(p.vps.id, p.vps)
  const vpsList = [...vpsMap.values()]

  async function excluir() {
    const ok = await confirm({
      title: `Excluir dono "${dono.nome}"?`,
      description: "Só é possível se não houver projetos vinculados.",
      confirmLabel: "Excluir",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(dono.id, {
      onSuccess: () => {
        toast.success("Dono excluído")
        onClose()
      },
      onError: (e) => toast.error("Não foi possível excluir", e instanceof Error ? e.message : undefined),
    })
  }

  const head = (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
      <OriginTag origin={dono.nome} />
    </div>
  )

  return (
    <Drawer
      title={head}
      onClose={onClose}
      footer={
        <Button variant="danger" icon="trash" onClick={excluir} disabled={remove.isPending} style={{ marginRight: "auto" }}>
          Excluir
        </Button>
      }
    >
      <Field label={`Projetos (${meus.length})`}>
        <div className="stack" style={{ gap: 2 }}>
          {meus.length === 0 && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Nenhum projeto deste dono.</p>}
          {meus.map((p) => (
            <div key={p.id} className="lrow click" style={{ padding: "8px 4px" }} onClick={() => navigate("/projetos")}>
              <span style={{ flex: 1, fontWeight: 600 }} className="truncate">{p.nome}</span>
              {p.vps && <span className="t-meta mono">{p.vps.nome || p.vps.ip}</span>}
            </div>
          ))}
        </div>
      </Field>

      <Field label={`VPS usadas (${vpsList.length})`}>
        <div className="stack" style={{ gap: 2 }}>
          {vpsList.length === 0 && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Nenhuma VPS vinculada.</p>}
          {vpsList.map((v) => (
            <div key={v.id} className="lrow click" style={{ padding: "8px 4px" }} onClick={() => navigate("/vps")}>
              <Icon name="server" size={15} style={{ color: "var(--muted)" }} />
              <span style={{ flex: 1, fontWeight: 600 }} className="truncate">{v.nome || "(sem nome)"}</span>
              <span className="t-meta mono">{v.ip}</span>
            </div>
          ))}
        </div>
      </Field>
    </Drawer>
  )
}
