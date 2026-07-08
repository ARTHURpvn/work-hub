import { useState } from "react"
import { projetosApi, type Projeto } from "@/api/projetos"
import { Icon } from "@/components/ui/Icon"
import { IconButton } from "@/components/ui/kit"
import { copyText } from "@/lib/utils"
import { toast } from "@/store/toastStore"

/** Visão read-only de um projeto — compartilhada pelo drawer de Projetos e pelo popup no VPS. */
export function ProjetoView({ projeto, onEdit }: { projeto: Projeto; onEdit?: () => void }) {
  const [reveal, setReveal] = useState<{ usuario: string; senha: string } | null>(null)

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

  return (
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
          {!projeto.site_url && !projeto.github_url &&
            (onEdit ? (
              <button className="det-link" onClick={onEdit} style={{ cursor: "pointer" }}>
                <Icon name="plus" size={14} /> Adicionar site / GitHub
              </button>
            ) : (
              <span className="muted" style={{ fontSize: 13 }}>Sem links</span>
            ))}
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
            <span className="muted" style={{ fontSize: 13.5 }}>Sem servidor vinculado</span>
          )}
        </div>
        {projeto.vps && (
          <div className="t-meta mono" style={{ marginTop: 6 }}>
            ssh root@{projeto.vps.ip}
          </div>
        )}
      </div>
    </div>
  )
}
