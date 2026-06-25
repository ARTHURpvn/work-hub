import { useNavigate } from "react-router-dom"
import { Icon, type IconName } from "@/components/ui/Icon"
import { Button, Empty, OriginTag, Progress, StatusPill } from "@/components/ui/kit"
import { dueLabel, fmtLong, STATUSES, statusMeta, todayISO } from "@/lib/domain"
import { useDashboard } from "@/hooks/useDashboard"
import { useDonos } from "@/hooks/useDonos"
import { useFerramentas } from "@/hooks/useFerramentas"
import { useProjetos } from "@/hooks/useProjetos"
import { useVpsList } from "@/hooks/useVps"
import { useTaskModalStore } from "@/store/taskModalStore"

export function Dashboard() {
  const navigate = useNavigate()
  const openTask = useTaskModalStore((s) => s.open)
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

  const { projetos, tarefas, tarefas_atencao, projetos_progresso, repositorios_por_vps } = data
  const concluidas = tarefas.por_status["Concluido"] ?? 0
  const abertas = tarefas.total - concluidas
  const isEmpty = projetos.total === 0 && tarefas.total === 0 && repositorios_por_vps.length === 0

  if (isEmpty) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="t-display">Dashboard</h1>
        </div>
        <div className="card card-pad">
          <Empty icon="dashboard" title="Seu painel está vazio">
            Comece criando um projeto ou uma tarefa. Os indicadores aqui se preenchem automaticamente.
          </Empty>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Button variant="primary" icon="plus" onClick={() => navigate("/projetos")}>
              Criar projeto
            </Button>
            <Button icon="plus" onClick={() => navigate("/tarefas")}>
              Criar tarefa
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const maxStatus = Math.max(1, ...STATUSES.map((s) => tarefas.por_status[s.id] ?? 0))

  const semVps = (listaProjetos ?? []).filter((p) => !p.arquivado && !p.vps_id).length
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
        <Button variant="primary" icon="plus" onClick={() => navigate("/tarefas")}>
          Nova tarefa
        </Button>
      </div>

      <div className="grid g-kpi" style={{ marginBottom: 18 }}>
        {kpi("Projetos ativos", data.projetos.ativos, "folder")}
        {kpi("Tarefas abertas", abertas, "check_list")}
        {kpi("Vencidas", tarefas.vencidas, "alert", true)}
        {kpi("Próximos 7 dias", tarefas.proximas_7_dias, "clock")}
      </div>

      <div className="grid g-kpi" style={{ marginBottom: 18 }}>
        {kpi("VPS", (vps ?? []).length, "server")}
        {kpi("Donos", (donos ?? []).length, "user")}
        {kpi("Ferramentas", (ferramentas ?? []).length, "key")}
        {kpi("Projetos sem VPS", semVps, "alert", true)}
      </div>

      <div className="split">
        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <div className="spread" style={{ marginBottom: 6 }}>
              <h3 className="t-h2" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="alert" size={18} style={{ color: "var(--danger)" }} /> Precisa de atenção
              </h3>
              <span className="chip static">{tarefas_atencao.length}</span>
            </div>
            {tarefas_atencao.length ? (
              tarefas_atencao.map((t) => {
                const dl = dueLabel(t.prazo)
                return (
                  <div key={t.id} className="lrow click" onClick={() => openTask(t.id)}>
                    <StatusPill status={t.status} late={t.vencida} />
                    <span style={{ flex: 1, fontWeight: 600 }} className="truncate">
                      {t.titulo || "(sem título)"}
                    </span>
                    {t.projeto_nome && (
                      <span className="t-meta truncate" style={{ maxWidth: 110 }}>
                        {t.projeto_nome}
                      </span>
                    )}
                    <span
                      className="t-meta mono"
                      style={{ width: 64, textAlign: "right", color: t.vencida ? "var(--danger)" : "var(--muted)" }}
                    >
                      {dl.txt}
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="muted" style={{ padding: "14px 0", margin: 0 }}>
                Nada urgente. ✨
              </p>
            )}
          </div>

          <div className="card card-pad">
            <h3 className="t-h2" style={{ marginBottom: 14 }}>
              Progresso por projeto
            </h3>
            {projetos_progresso.length ? (
              projetos_progresso.slice(0, 6).map((p) => {
                const pct = p.total ? Math.round((p.concluidas / p.total) * 100) : 0
                return (
                  <div key={p.id} className="lrow click" onClick={() => navigate("/projetos")} style={{ gap: 14 }}>
                    <OriginTag origin={p.origem} />
                    <span style={{ flex: 1, fontWeight: 600 }} className="truncate">
                      {p.nome || "(sem nome)"}
                    </span>
                    <div style={{ width: 130 }}>
                      <Progress pct={pct} />
                    </div>
                    <span className="t-meta mono" style={{ width: 34, textAlign: "right" }}>
                      {pct}%
                    </span>
                  </div>
                )
              })
            ) : (
              <p className="muted" style={{ margin: 0, padding: "8px 0" }}>
                Nenhum projeto ativo.
              </p>
            )}
          </div>

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
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <h3 className="t-h2" style={{ marginBottom: 16 }}>
              Tarefas por status
            </h3>
            <div className="row" style={{ alignItems: "flex-end", gap: 12, height: 130, padding: "0 4px" }}>
              {STATUSES.map((s) => {
                const n = tarefas.por_status[s.id] ?? 0
                return (
                  <div
                    key={s.id}
                    style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
                    onClick={() => navigate("/kanban")}
                  >
                    <div style={{ height: 90, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${(n / maxStatus) * 90}px`,
                          minHeight: n ? 6 : 2,
                          background: s.kdot,
                          borderRadius: "6px 6px 0 0",
                          opacity: n ? 1 : 0.3,
                          transition: "height .4s",
                        }}
                      />
                    </div>
                    <div className="mono" style={{ fontWeight: 800, fontSize: 15, marginTop: 6 }}>
                      {n}
                    </div>
                    <div className="t-meta" style={{ marginTop: 1 }}>
                      {statusMeta(s.id).label.replace("Em ", "")}
                    </div>
                  </div>
                )
              })}
            </div>
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
    </div>
  )
}
