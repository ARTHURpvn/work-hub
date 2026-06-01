import { GitBranch, Globe, KeyRound, Lock, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Projeto } from "@/api/projetos"

const origemVariant: Record<string, "blue" | "purple" | "green" | "warning"> = {
  Otavio: "blue",
  Titan: "purple",
  Freelas: "green",
  Pessoal: "warning",
}

interface Props {
  projeto: Projeto
  onClick: () => void
}

export function ProjetoCard({ projeto, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 ${projeto.arquivado ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{projeto.nome}</span>
            {projeto.arquivado && (
              <Badge variant="outline" className="text-xs">arquivado</Badge>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge variant={origemVariant[projeto.origem] ?? "secondary"}>
              {projeto.origem}
            </Badge>
            {projeto.tem_autenticacao && (
              <span title="Tem autenticação" className="text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}
            {projeto.tem_credencial && (
              <span title="Credencial salva" className="text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5" />
              </span>
            )}
            {projeto.vps && (
              <span
                title={`VPS: ${projeto.vps.nome ? `${projeto.vps.nome} (${projeto.vps.ip})` : projeto.vps.ip}`}
                className="text-muted-foreground"
              >
                <Server className="h-3.5 w-3.5" />
              </span>
            )}
            {projeto.site_url && (
              <span title="Tem link do site" className="text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
              </span>
            )}
            {projeto.github_url && (
              <span title="Tem link do GitHub" className="text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {projeto.membros.length} membro{projeto.membros.length !== 1 ? "s" : ""}
        </span>
      </div>
    </button>
  )
}
