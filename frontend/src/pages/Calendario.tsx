import { useMemo, useState } from "react"
import type { TipoCalendario } from "@/api/calendario"
import { Icon } from "@/components/ui/Icon"
import { Button, IconButton } from "@/components/ui/kit"
import { daysUntil, fmtDate, isLate } from "@/lib/domain"
import { useIntegracaoMutations, useIntegracoes } from "@/hooks/useCalendario"
import { useTarefas } from "@/hooks/useTarefas"
import { toast } from "@/store/toastStore"
import { useTaskModalStore } from "@/store/taskModalStore"

const DOWS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
const TIPOS: { tipo: TipoCalendario; nome: string }[] = [
  { tipo: "google", nome: "Google Calendar" },
  { tipo: "icloud", nome: "iCloud" },
]

export function Calendario() {
  const openTask = useTaskModalStore((s) => s.open)
  const { data: tarefas } = useTarefas()
  const { data: integracoes } = useIntegracoes()
  const { setAtiva, sync } = useIntegracaoMutations()

  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const comPrazo = (tarefas ?? []).filter((t) => t.prazo)

  const cells = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1)
    const startDow = first.getDay()
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const arr: (number | null)[] = []
    for (let i = 0; i < startDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    while (arr.length % 7 !== 0) arr.push(null)
    return arr
  }, [cursor])

  const today = new Date()
  const isToday = (d: number | null) =>
    d !== null && cursor.y === today.getFullYear() && cursor.m === today.getMonth() && d === today.getDate()

  const evsFor = (d: number | null) => {
    if (d === null) return []
    const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    return comPrazo.filter((t) => (t.prazo ?? "").slice(0, 10) === iso)
  }

  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  const nav = (delta: number) =>
    setCursor((c) => {
      let m = c.m + delta
      let y = c.y
      if (m < 0) {
        m = 11
        y--
      }
      if (m > 11) {
        m = 0
        y++
      }
      return { y, m }
    })

  const upcoming = comPrazo
    .filter((t) => {
      const n = daysUntil(t.prazo)
      return t.status !== "Concluido" && n !== null && n >= 0
    })
    .sort((a, b) => (daysUntil(a.prazo) ?? 0) - (daysUntil(b.prazo) ?? 0))
    .slice(0, 6)

  const algumaAtiva = (integracoes ?? []).some((i) => i.ativa)

  return (
    <div className="page" style={{ maxWidth: 1280 }}>
      <div className="page-head">
        <div>
          <h1 className="t-display">Calendário</h1>
          <div className="sub">Prazos das suas tarefas</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <IconButton name="chevron_l" onClick={() => nav(-1)} />
          <span style={{ fontWeight: 700, minWidth: 150, textAlign: "center", textTransform: "capitalize" }}>
            {monthName}
          </span>
          <IconButton name="chevron_r" onClick={() => nav(1)} />
          <Button
            size="sm"
            onClick={() => {
              const d = new Date()
              setCursor({ y: d.getFullYear(), m: d.getMonth() })
            }}
          >
            Hoje
          </Button>
        </div>
      </div>

      <div className="split">
        <div className="cal">
          <div className="cal-dows">
            {DOWS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="cal-grid">
            {cells.map((d, i) => (
              <div key={i} className={"cal-cell" + (d ? "" : " dim") + (isToday(d) ? " today" : "")}>
                {d ? <span className="dnum">{d}</span> : null}
                {evsFor(d)
                  .slice(0, 3)
                  .map((t) => (
                    <div
                      key={t.id}
                      className={"cal-ev" + (isLate(t) ? " late" : t.status === "Concluido" ? " done" : "")}
                      onClick={() => openTask(t.id)}
                      title={t.titulo}
                    >
                      {t.titulo || "(sem título)"}
                    </div>
                  ))}
                {evsFor(d).length > 3 ? (
                  <div className="t-meta" style={{ paddingLeft: 4 }}>
                    +{evsFor(d).length - 3}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="stack" style={{ gap: 18 }}>
          <div className="card card-pad">
            <div className="spread" style={{ marginBottom: 4 }}>
              <h3 className="t-h2">Integrações</h3>
              <Button
                size="sm"
                icon="refresh"
                disabled={!algumaAtiva || sync.isPending}
                onClick={() =>
                  sync.mutate(undefined, {
                    onSuccess: (r) => toast.success("Sincronizado", `${r.ok}/${r.processados} ok`),
                    onError: (e) => toast.error("Erro ao sincronizar", e instanceof Error ? e.message : undefined),
                  })
                }
              >
                {sync.isPending ? "Sincronizando…" : "Sincronizar"}
              </Button>
            </div>
            <p className="t-meta" style={{ marginBottom: 14 }}>
              Conecte um calendário para espelhar seus prazos.
            </p>
            {TIPOS.map(({ tipo, nome }) => {
              const integ = (integracoes ?? []).find((i) => i.tipo === tipo)
              return (
                <div key={tipo} className="lrow" style={{ padding: "10px 4px" }}>
                  <div className="avatar" style={{ borderRadius: 8 }}>
                    <Icon name="calendar" size={15} />
                  </div>
                  <span style={{ flex: 1, fontWeight: 600 }}>{nome}</span>
                  {integ ? (
                    <Button
                      size="sm"
                      onClick={() => setAtiva.mutate({ id: integ.id, ativa: !integ.ativa })}
                    >
                      {integ.ativa ? "Ativa" : "Inativa"}
                    </Button>
                  ) : (
                    <Button size="sm" disabled>
                      Conectar
                    </Button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="card card-pad">
            <h3 className="t-h2" style={{ marginBottom: 12 }}>
              Próximos prazos
            </h3>
            {upcoming.length ? (
              upcoming.map((t) => (
                <div key={t.id} className="lrow click" onClick={() => openTask(t.id)}>
                  <span
                    className={"pill " + (isLate(t) ? "pill-late" : "pill-doing")}
                    style={{ minWidth: 56, justifyContent: "center" }}
                  >
                    {fmtDate(t.prazo)}
                  </span>
                  <span style={{ flex: 1, fontWeight: 600 }} className="truncate">
                    {t.titulo || "(sem título)"}
                  </span>
                </div>
              ))
            ) : (
              <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>
                Nenhum prazo à frente.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
