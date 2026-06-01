import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateTarefa, useDeleteTarefa, useUpdateTarefa } from "@/hooks/useTarefas"
import { useProjetos } from "@/hooks/useProjetos"
import type { Prioridade, Status, Tarefa } from "@/api/tarefas"

const PRIORIDADES: Prioridade[] = ["baixa", "media", "alta"]
const STATUSES: Status[] = ["A Fazer", "Em Andamento", "Em Revisao", "Concluido"]
const STATUS_LABEL: Record<Status, string> = {
  "A Fazer": "A Fazer",
  "Em Andamento": "Em Andamento",
  "Em Revisao": "Em Revisão",
  Concluido: "Concluído",
}

interface Props {
  tarefa?: Tarefa
  onSaved: () => void
  onCancel: () => void
}

export function TarefaForm({ tarefa, onSaved, onCancel }: Props) {
  const isEdit = !!tarefa

  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "")
  const [descricao, setDescricao] = useState(tarefa?.descricao ?? "")
  const [prazo, setPrazo] = useState(tarefa?.prazo ? tarefa.prazo.slice(0, 16) : "")
  const [prioridade, setPrioridade] = useState<Prioridade>(tarefa?.prioridade ?? "media")
  const [statusVal, setStatusVal] = useState<Status>(tarefa?.status ?? "A Fazer")
  const [projetoId, setProjetoId] = useState(tarefa?.projeto_id ?? "")
  const [publicavel, setPublicavel] = useState(tarefa?.publicavel ?? false)
  const [error, setError] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const create = useCreateTarefa()
  const update = useUpdateTarefa()
  const del = useDeleteTarefa()
  const { data: projetos } = useProjetos({ arquivado: false })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      prazo: prazo ? new Date(prazo).toISOString() : null,
      prioridade,
      status: statusVal,
      projeto_id: projetoId || null,
      publicavel,
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: tarefa.id, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  async function handleDelete() {
    if (!tarefa) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    try {
      await del.mutateAsync(tarefa.id)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir")
    }
  }

  const pending = create.isPending || update.isPending || del.isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" type="datetime-local" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <div className="flex gap-1">
            {PRIORIDADES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioridade(p)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                  prioridade === p ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <div className="grid grid-cols-2 gap-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusVal(s)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                statusVal === s ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="projeto">Projeto</Label>
        <select
          id="projeto"
          value={projetoId}
          onChange={(e) => setProjetoId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Sem projeto</option>
          {projetos?.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={publicavel} onChange={(e) => setPublicavel(e.target.checked)} />
        Publicável no LinkedIn
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar tarefa"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {isEdit && (
        <Button type="button" variant="destructive" className="w-full" onClick={handleDelete} disabled={pending}>
          {confirmDelete ? "Confirmar exclusão?" : "Excluir tarefa"}
        </Button>
      )}
    </form>
  )
}
