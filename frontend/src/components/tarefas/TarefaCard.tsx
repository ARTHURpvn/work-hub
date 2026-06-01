import { Calendar, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Tarefa } from "@/api/tarefas"

const prioridadeVariant: Record<string, "blue" | "purple" | "green" | "destructive" | "secondary"> = {
  alta: "destructive",
  media: "blue",
  baixa: "secondary",
}

const statusVariant: Record<string, string> = {
  "A Fazer": "bg-gray-100 text-gray-700",
  "Em Andamento": "bg-blue-100 text-blue-700",
  "Em Revisao": "bg-yellow-100 text-yellow-700",
  Concluido: "bg-green-100 text-green-700",
}

const statusLabel: Record<string, string> = {
  "A Fazer": "A Fazer",
  "Em Andamento": "Em Andamento",
  "Em Revisao": "Em Revisão",
  Concluido: "Concluído",
}

interface Props {
  tarefa: Tarefa
  onClick: () => void
}

export function TarefaCard({ tarefa, onClick }: Props) {
  const prazoDate = tarefa.prazo ? new Date(tarefa.prazo) : null
  const prazoStr = prazoDate?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
  const atrasada = prazoDate && prazoDate < new Date() && tarefa.status !== "Concluido"

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 rounded-md border bg-background px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      {/* Indicador de revisão */}
      {tarefa.retornou_de_revisao && (
        <span title={`Voltou de revisão ${tarefa.revisao_retornos}×`} className="shrink-0">
          <RotateCcw className="h-4 w-4 text-orange-500" />
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium truncate ${tarefa.status === "Concluido" ? "line-through text-muted-foreground" : ""}`}>
            {tarefa.titulo}
          </span>
          {tarefa.retornou_de_revisao && (
            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs shrink-0">
              ↩ {tarefa.revisao_retornos}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {prazoStr && (
          <span className={`flex items-center gap-1 text-xs ${atrasada ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3 w-3" />
            {prazoStr}
          </span>
        )}
        <Badge variant={prioridadeVariant[tarefa.prioridade] ?? "secondary"} className="text-xs">
          {tarefa.prioridade}
        </Badge>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusVariant[tarefa.status] ?? ""}`}>
          {statusLabel[tarefa.status] ?? tarefa.status}
        </span>
      </div>
    </button>
  )
}

export { statusLabel, statusVariant, prioridadeVariant }
