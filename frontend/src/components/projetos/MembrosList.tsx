import { Trash2, UserPlus } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAddMembro, useRemoveMembro } from "@/hooks/useProjetos"
import type { Membro } from "@/api/projetos"

interface Props {
  projetoId: string
  membros: Membro[]
}

export function MembrosList({ projetoId, membros }: Props) {
  const [nome, setNome] = useState("")
  const [contato, setContato] = useState("")
  const addMembro = useAddMembro()
  const removeMembro = useRemoveMembro()

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    addMembro.mutate(
      { id: projetoId, nome: nome.trim(), contato: contato.trim() || undefined },
      { onSuccess: () => { setNome(""); setContato("") } }
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Membros</p>

      {membros.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum membro cadastrado</p>
      )}

      <ul className="space-y-1">
        {membros.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
            <span>
              {m.nome}
              {m.contato && <span className="text-muted-foreground ml-1">({m.contato})</span>}
            </span>
            <button
              onClick={() => removeMembro.mutate({ projetoId, membroId: m.id })}
              disabled={removeMembro.isPending}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remover membro"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <Input
          placeholder="Nome do membro"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="text-sm"
        />
        <Input
          placeholder="Contato (opcional)"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          className="text-sm"
        />
        <Button type="submit" variant="outline" size="sm" disabled={addMembro.isPending}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Adicionar membro
        </Button>
      </form>
    </div>
  )
}
