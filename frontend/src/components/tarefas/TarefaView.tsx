import { Badge } from "@/components/ui/badge"
import { DetailField } from "@/components/common/DetailSheet"
import { useProjetos } from "@/hooks/useProjetos"
import type { Status, Tarefa } from "@/api/tarefas"

const STATUS_LABEL: Record<Status, string> = {
  "A Fazer": "A Fazer",
  "Em Andamento": "Em Andamento",
  "Em Revisao": "Em Revisão",
  Concluido: "Concluído",
}

function formatPrazo(iso: string | null): string {
  if (!iso) return "Sem prazo"
  const d = new Date(iso)
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export function TarefaView({ tarefa }: { tarefa: Tarefa }) {
  const { data: projetos } = useProjetos({ arquivado: undefined })
  const projetoNome = tarefa.projeto_id
    ? projetos?.find((p) => p.id === tarefa.projeto_id)?.nome ?? "—"
    : "Sem projeto"

  const prazoVencido =
    tarefa.prazo && tarefa.status !== "Concluido" && new Date(tarefa.prazo) < new Date()

  return (
    <div className="space-y-5">
      <DetailField label="Status">
        <Badge variant="secondary">{STATUS_LABEL[tarefa.status]}</Badge>
      </DetailField>

      <DetailField label="Prioridade">
        <span className="capitalize">{tarefa.prioridade}</span>
      </DetailField>

      <DetailField label="Prazo">
        <span className={prazoVencido ? "text-destructive" : undefined}>
          {formatPrazo(tarefa.prazo)}
          {prazoVencido && " (vencido)"}
        </span>
      </DetailField>

      <DetailField label="Projeto">{projetoNome}</DetailField>

      <DetailField label="Descrição">
        {tarefa.descricao ? (
          <p className="whitespace-pre-wrap">{tarefa.descricao}</p>
        ) : (
          <span className="text-muted-foreground">Sem descrição</span>
        )}
      </DetailField>

      {tarefa.publicavel && (
        <DetailField label="LinkedIn">Marcada como publicável</DetailField>
      )}

      {tarefa.retornou_de_revisao && (
        <DetailField label="Revisão">
          Retornou de revisão {tarefa.revisao_retornos > 0 && `(${tarefa.revisao_retornos}x)`}
        </DetailField>
      )}
    </div>
  )
}
