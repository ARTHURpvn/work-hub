import { ExternalLink, GitBranch, Globe } from "lucide-react"
import { DetailField } from "@/components/common/DetailSheet"
import type { VpsComProjetos } from "@/api/vps"

interface Props {
  vps: VpsComProjetos
}

export function VpsView({ vps }: Props) {
  return (
    <div className="space-y-5">
      <DetailField label="IP">
        <span className="font-mono">{vps.ip}</span>
      </DetailField>

      {vps.provedor && <DetailField label="Provedor">{vps.provedor}</DetailField>}

      <DetailField label={`Projetos nesta VPS (${vps.projetos.length})`}>
        {vps.projetos.length === 0 ? (
          <span className="text-muted-foreground">Nenhum projeto vinculado.</span>
        ) : (
          <ul className="space-y-2">
            {vps.projetos.map((p) => (
              <li key={p.id} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-xs text-muted-foreground">{p.origem}</span>
                </div>
                {(p.site_url || p.github_url) && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {p.site_url && (
                      <a href={p.site_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <Globe className="h-3 w-3" /> site <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {p.github_url && (
                      <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <GitBranch className="h-3 w-3" /> github <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </DetailField>
    </div>
  )
}
