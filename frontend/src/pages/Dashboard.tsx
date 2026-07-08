import { useNavigate } from "react-router-dom"
import { Icon, type IconName } from "@/components/ui/Icon"
import { Button, Empty, OriginTag, Progress } from "@/components/ui/kit"
import { fmtDate, fmtLong, todayISO } from "@/lib/domain"
import { useDashboard } from "@/hooks/useDashboard"
import { useDonos } from "@/hooks/useDonos"
import { useFerramentas } from "@/hooks/useFerramentas"
import { useProjetos } from "@/hooks/useProjetos"
import { useVpsList } from "@/hooks/useVps"

export function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useDashboard()
  const { data: donos } = useDonos()
  const { data: vps } = useVpsList()
  const { data: ferramentas } = useFerramentas()
  const { data: listaProjetos } = useProjetos()

  if (isLoading || !data) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="t-display">Dashboard</h1>
        </div>
        <p className="muted">Carregando…</p>
      </div>
    )
  }

  const repositorios_por_vps = data.repositorios_por_vps
  const isEmpty =
    data.projetos.total === 0 && data.projetos.ideias === 0 && repositorios_por_vps.length === 0

  if (isEmpty) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="t-display">Dashboard</h1>
        </div>
        <div className="card card-pad">
          <Empty icon="dashboard" title="Seu painel está vazio">
            Comece criando um projeto. Os indicadores aqui se preenchem automaticamente.
          </Empty>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Button variant="primary" icon="plus" onClick={() => navigate("/projetos")}>
              Criar projeto
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const ativosProj = (listaProjetos ?? []).filter((p) => !p.arquivado && !p.rascunho)
  const semVps = ativosProj.filter((p) => !p.vps_id).length
  const saude: { label: string; count: number; icon: IconName }[] = [
    { label: "Sem VPS", count: semVps, icon: "server" },
    { label: "Sem descrição", count: ativosProj.filter((p) => !p.descricao?.trim()).length, icon: "edit" },
    { label: "Sem GitHub", count: ativosProj.filter((p) => !p.github_url).length, icon: "external" },
    { label: "Sem site", count: ativosProj.filter((p) => !p.site_url).length, icon: "link" },
  ]
  const recentes = (listaProjetos ?? [])
    .filter((p) => !p.rascunho && !p.arquivado)
    .slice()
    .sort((a, b) => (a.criado_em < b.criado_em ? 1 : -1))
    .slice(0, 5)

  const donosList = (donos ?? []).filter((d) => d.projetos_count > 0)
  const maxDono = Math.max(1, ...donosList.map((d) => d.projetos_count))

  const kpi = (lbl: string, num: number, icon: IconName, alert?: boolean) => (
    <div className="card kpi">
      <div className="lbl">
        <Icon name={icon} size={16} /> {lbl}
      </div>
      <div className={"num" + (alert && num > 0 ? " alert" : "")}>{num}</div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">Bom dia 👋</h1>
          <div className="sub" style={{ textTransform: "capitalize" }}>
            {fmtLong(todayISO())}
          </div>
        </div>
        <Button variant="primary" icon="plus" onClick={() => navigate("/projetos")}>
          Novo projeto
        </Button>
      </div>

      <div className="grid g-kpi" style={{ marginBottom: 18 }}>
        {kpi("Projetos ativos", data.projetos.ativos, "folder")}
        {kpi("Ideias", data.projetos.ideias, "sparkle")}
        {kpi("VPS", (vps ?? []).length, "server")}
        {kpi("Ferramentas", (ferramentas ?? []).length, "key")}
      </div>

      <div className="split" style={{ marginBottom: 18 }}>
        <div className="card card-pad">
          <div className="spread" style={{ marginBottom: 14 }}>
            <h3 className="t-h2">Saúde do cadastro</h3>
            <span className="chip static" onClick={() => navigate("/projetos")} style={{ cursor: "pointer" }}>
              ver projetos
            </span>
          </div>
          {ativosProj.length ? (
            saude.map((s) => (
              <div key={s.label} className="lrow click" onClick={() => navigate("/projetos")} style={{ gap: 12 }}>
                <div className="avatar" style={{ borderRadius: 8 }}>
                  <Icon name={s.icon} size={15} />
                </div>
                <span style={{ flex: 1 }}>{s.label}</span>
                <span
                  className={"chip static" + (s.count > 0 ? " alert" : "")}
                  style={s.count > 0 ? { color: "var(--danger)", borderColor: "var(--danger)" } : undefined}
                >
                  {s.count}
                </span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0, padding: "8px 0" }}>
              Nenhum projeto ativo. Cadastre um projeto para acompanhar a saúde do cadastro.
            </p>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="t-h2" style={{ marginBottom: 12 }}>
            Projetos recentes
          </h3>
          {recentes.length ? (
            recentes.map((p) => (
              <div key={p.id} className="lrow click" onClick={() => navigate("/projetos")} style={{ gap: 12 }}>
                <OriginTag origin={p.origem} />
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }} className="truncate">
                  {p.nome || "(sem nome)"}
                </span>
                <span className="t-meta mono" style={{ whiteSpace: "nowrap" }}>
                  {fmtDate(p.criado_em)}
                </span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0, padding: "8px 0" }}>
              Nenhum projeto ainda.
            </p>
          )}
        </div>
      </div>

      <div className="split">
        <div className="card card-pad">
          <div className="spread" style={{ marginBottom: 14 }}>
            <h3 className="t-h2">Projetos por dono</h3>
            <span className="chip static" onClick={() => navigate("/donos")} style={{ cursor: "pointer" }}>
              ver donos
            </span>
          </div>
          {donosList.length ? (
            donosList.map((d) => (
              <div key={d.id} className="lrow click" onClick={() => navigate("/donos")} style={{ gap: 14 }}>
                <OriginTag origin={d.nome} />
                <div style={{ flex: 1 }}>
                  <Progress pct={Math.round((d.projetos_count / maxDono) * 100)} />
                </div>
                <span className="t-meta mono" style={{ width: 92, textAlign: "right" }}>
                  {d.projetos_count} proj · {d.vps_count} vps
                </span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0, padding: "8px 0" }}>
              Nenhum dono com projetos.
            </p>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="t-h2" style={{ marginBottom: 12 }}>
            Repositórios por VPS
          </h3>
          {repositorios_por_vps.length ? (
            repositorios_por_vps.map((v) => (
              <div key={v.id} className="lrow click" onClick={() => navigate("/vps")}>
                <div className="avatar" style={{ borderRadius: 8 }}>
                  <Icon name="server" size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }} className="truncate">
                    {v.nome || v.ip}
                  </div>
                  <div className="t-meta">
                    {v.projetos.length} projeto{v.projetos.length === 1 ? "" : "s"}
                  </div>
                </div>
                <span className="t-meta mono">{v.ip}</span>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0, padding: "8px 0" }}>
              Nenhuma VPS cadastrada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
