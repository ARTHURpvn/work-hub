import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { useProjetos } from "@/hooks/useProjetos"
import { useVpsList } from "@/hooks/useVps"

interface Result {
  type: string
  label: string
  act: () => void
}

export function SearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { data: projetos } = useProjetos()
  const { data: vps } = useVpsList()
  const [q, setQ] = useState("")

  const ql = q.trim().toLowerCase()
  const results = useMemo<Result[]>(() => {
    if (!ql) return []
    const r: Result[] = []
    for (const p of projetos ?? []) {
      if (p.nome.toLowerCase().includes(ql)) r.push({ type: "Projeto", label: p.nome, act: () => navigate("/projetos") })
    }
    for (const v of vps ?? []) {
      const nome = v.nome || v.ip
      if (nome.toLowerCase().includes(ql)) r.push({ type: "VPS", label: nome, act: () => navigate("/vps") })
    }
    return r.slice(0, 8)
  }, [ql, projetos, vps, navigate])

  return (
    <Modal onClose={onClose} title={undefined}>
      <div className="input-icon" style={{ marginBottom: results.length ? 14 : 0 }}>
        <Icon name="search" />
        <input
          className="input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar projetos, VPS…"
        />
      </div>
      {results.map((r, i) => (
        <div
          key={i}
          className="lrow click"
          onClick={() => {
            r.act()
            onClose()
          }}
        >
          <span className="t-label" style={{ width: 60 }}>
            {r.type}
          </span>
          <span style={{ fontWeight: 600 }}>{r.label}</span>
        </div>
      ))}
      {ql && !results.length && (
        <p className="muted" style={{ textAlign: "center", padding: "18px 0", margin: 0 }}>
          Nada encontrado.
        </p>
      )}
    </Modal>
  )
}
