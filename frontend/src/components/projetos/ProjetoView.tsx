import { ExternalLink, GitBranch, Globe, Lock, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DetailField } from "@/components/common/DetailSheet"
import { CredencialBox } from "./CredencialBox"
import type { Projeto } from "@/api/projetos"

interface Props {
  projeto: Projeto
}

function LinkButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
    >
      {icon}
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  )
}

export function ProjetoView({ projeto }: Props) {
  return (
    <div className="space-y-5">
      <DetailField label="Origem">
        <Badge variant="secondary">{projeto.origem}</Badge>
        {projeto.arquivado && <Badge variant="outline" className="ml-2">arquivado</Badge>}
      </DetailField>

      {/* Links rápidos */}
      {(projeto.site_url || projeto.github_url) && (
        <div className="flex flex-wrap gap-2">
          {projeto.site_url && (
            <LinkButton href={projeto.site_url} icon={<Globe className="h-4 w-4" />} label="Abrir site" />
          )}
          {projeto.github_url && (
            <LinkButton href={projeto.github_url} icon={<GitBranch className="h-4 w-4" />} label="Abrir GitHub" />
          )}
        </div>
      )}

      <DetailField label="VPS">
        {projeto.vps ? (
          <span className="inline-flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-muted-foreground" />
            {projeto.vps.nome ? `${projeto.vps.nome} (${projeto.vps.ip})` : projeto.vps.ip}
          </span>
        ) : (
          <span className="text-muted-foreground">Não vinculada</span>
        )}
      </DetailField>

      <DetailField label="Características">
        <ul className="flex flex-col gap-1">
          <li className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            {projeto.tem_autenticacao ? "Tem autenticação" : "Sem autenticação"}
          </li>
          {projeto.publicavel && (
            <li className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Publicável no LinkedIn
            </li>
          )}
        </ul>
      </DetailField>

      {projeto.tem_autenticacao && (
        <DetailField label="Acesso">
          <CredencialBox projetoId={projeto.id} temCredencial={projeto.tem_credencial} editable={false} />
        </DetailField>
      )}

      <DetailField label={`Membros (${projeto.membros.length})`}>
        {projeto.membros.length === 0 ? (
          <span className="text-muted-foreground">Nenhum membro</span>
        ) : (
          <ul className="space-y-0.5">
            {projeto.membros.map((m) => (
              <li key={m.id}>
                {m.nome}
                {m.contato && <span className="text-muted-foreground"> ({m.contato})</span>}
              </li>
            ))}
          </ul>
        )}
      </DetailField>
    </div>
  )
}
