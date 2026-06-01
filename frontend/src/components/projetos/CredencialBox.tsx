import { useQuery } from "@tanstack/react-query"
import { Eye, EyeOff, KeyRound, Trash2 } from "lucide-react"
import { useState } from "react"
import { projetosApi } from "@/api/projetos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDeleteCredencial, useUpsertCredencial } from "@/hooks/useCredencial"

interface Props {
  projetoId: string
  temCredencial: boolean
  /** true no modo edição: permite salvar/remover. false no modo visualização. */
  editable: boolean
}

export function CredencialBox({ projetoId, temCredencial, editable }: Props) {
  const { data: cred } = useQuery({
    queryKey: ["credencial", projetoId],
    queryFn: () => projetosApi.getCredencial(projetoId),
    enabled: temCredencial,
    retry: false,
  })

  const upsert = useUpsertCredencial()
  const del = useDeleteCredencial()

  const [revealed, setRevealed] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [usuario, setUsuario] = useState("")
  const [senha, setSenha] = useState("")
  const [error, setError] = useState("")

  async function handleReveal() {
    if (revealed !== null) {
      setRevealed(null)
      return
    }
    try {
      const r = await projetosApi.revelarCredencial(projetoId)
      setRevealed(r.senha)
    } catch {
      setError("Não foi possível revelar a senha")
    }
  }

  function startEdit() {
    setUsuario(cred?.usuario ?? "")
    setSenha("")
    setError("")
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!usuario.trim() || !senha.trim()) {
      setError("Usuário e senha são obrigatórios")
      return
    }
    try {
      await upsert.mutateAsync({ id: projetoId, usuario: usuario.trim(), senha })
      setEditing(false)
      setSenha("")
      setRevealed(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar credencial")
    }
  }

  // --- Modo formulário (adicionar/editar) ---
  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-2 rounded-md border p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <KeyRound className="h-3.5 w-3.5" /> Credencial do site
        </p>
        <div className="space-y-1">
          <Label htmlFor="cred-user" className="text-xs">Usuário</Label>
          <Input id="cred-user" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cred-pass" className="text-xs">Senha</Label>
          <Input id="cred-pass" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={upsert.isPending}>
            {upsert.isPending ? "Salvando..." : "Salvar credencial"}
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    )
  }

  // --- Sem credencial ---
  if (!temCredencial) {
    return (
      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5" /> Nenhuma credencial salva.
        </p>
        {editable && (
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={startEdit}>
            Adicionar credencial
          </Button>
        )}
      </div>
    )
  }

  // --- Com credencial (visualização) ---
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <KeyRound className="h-3.5 w-3.5" /> Credencial do site
      </p>
      <p className="text-sm">
        <span className="text-muted-foreground">Usuário:</span> {cred?.usuario ?? "—"}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Senha:</span>
        <span className="font-mono">{revealed ?? "••••••••"}</span>
        <button
          type="button"
          onClick={handleReveal}
          className="text-muted-foreground hover:text-foreground"
          aria-label={revealed ? "Ocultar senha" : "Revelar senha"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {editable && (
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={startEdit}>
            Alterar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={del.isPending}
            onClick={() => {
              if (confirm("Remover a credencial salva deste projeto?")) {
                del.mutate(projetoId)
                setRevealed(null)
              }
            }}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
          </Button>
        </div>
      )}
    </div>
  )
}
