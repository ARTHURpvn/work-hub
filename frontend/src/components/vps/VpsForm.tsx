import { Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateVps, useDeleteVps, useUpdateVps } from "@/hooks/useVps"
import type { VpsComProjetos } from "@/api/vps"

interface Props {
  vps?: VpsComProjetos
  onSaved: () => void
  onCancel: () => void
  onDeleted: () => void
}

export function VpsForm({ vps, onSaved, onCancel, onDeleted }: Props) {
  const isEdit = !!vps
  const [nome, setNome] = useState(vps?.nome ?? "")
  const [ip, setIp] = useState(vps?.ip ?? "")
  const [provedor, setProvedor] = useState(vps?.provedor ?? "")
  const [error, setError] = useState("")

  const create = useCreateVps()
  const update = useUpdateVps()
  const del = useDeleteVps()
  const pending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const payload = {
      nome: nome.trim() || null,
      ip: ip.trim(),
      provedor: provedor.trim() || null,
    }
    try {
      if (isEdit) {
        await update.mutateAsync({ id: vps.id, data: payload })
      } else {
        await create.mutateAsync(payload)
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  async function handleDelete() {
    if (!vps) return
    const aviso = vps.projetos.length
      ? `Esta VPS tem ${vps.projetos.length} projeto(s) vinculado(s). Eles serão desvinculados (não excluídos). Continuar?`
      : "Excluir esta VPS?"
    if (!confirm(aviso)) return
    try {
      await del.mutateAsync(vps.id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vps-nome">Nome (opcional)</Label>
        <Input id="vps-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Contabo-01" autoFocus />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vps-ip">IP *</Label>
        <Input id="vps-ip" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.10" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vps-prov">Provedor (opcional)</Label>
        <Input id="vps-prov" value={provedor} onChange={(e) => setProvedor(e.target.value)} placeholder="Contabo, Hetzner, AWS..." />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar VPS"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {isEdit && (
        <Button
          type="button"
          variant="secondary"
          className="w-full text-destructive"
          disabled={del.isPending}
          onClick={handleDelete}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" /> Excluir VPS
        </Button>
      )}
    </form>
  )
}
