import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { MembrosList } from "./MembrosList"
import { CredencialBox } from "./CredencialBox"
import { useCreateProjeto, useUpdateProjeto } from "@/hooks/useProjetos"
import { useVpsList } from "@/hooks/useVps"
import { toast } from "@/store/toastStore"
import type { Origem, Projeto } from "@/api/projetos"

interface Props {
  projeto?: Projeto
  onSaved: () => void
  onCancel: () => void
}

const ORIGENS: Origem[] = ["Otavio", "Titan", "Freelas", "Pessoal"]

export function ProjetoForm({ projeto, onSaved, onCancel }: Props) {
  const isEdit = !!projeto
  const { data: vpsList } = useVpsList()

  const [nome, setNome] = useState(projeto?.nome ?? "")
  const [descricao, setDescricao] = useState(projeto?.descricao ?? "")
  const [origem, setOrigem] = useState<Origem>(projeto?.origem ?? "Freelas")
  const [temAuth, setTemAuth] = useState(projeto?.tem_autenticacao ?? false)
  const [publicavel, setPublicavel] = useState(projeto?.publicavel ?? false)
  const [arquivado, setArquivado] = useState(projeto?.arquivado ?? false)
  const [vpsId, setVpsId] = useState(projeto?.vps_id ?? "")
  const [github, setGithub] = useState(projeto?.github_url ?? "")
  const [site, setSite] = useState(projeto?.site_url ?? "")
  const [error, setError] = useState("")

  const create = useCreateProjeto()
  const update = useUpdateProjeto()
  const pending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      origem,
      tem_autenticacao: temAuth,
      publicavel,
      vps_id: vpsId || null,
      github_url: github.trim() || null,
      site_url: site.trim() || null,
    }

    try {
      if (isEdit) {
        await update.mutateAsync({ id: projeto.id, data: { ...payload, arquivado } })
        toast.success("Projeto atualizado")
      } else {
        await create.mutateAsync(payload)
        toast.success("Projeto criado")
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar")
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus />
        </div>

        <div className="space-y-2">
          <Label htmlFor="proj-descricao">Descrição</Label>
          <Textarea
            id="proj-descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Do que se trata o projeto, contexto, objetivo..."
          />
        </div>

        <div className="space-y-2">
          <Label>Origem *</Label>
          <div className="flex gap-2">
            {ORIGENS.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrigem(o)}
                className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  origem === o ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vps">VPS</Label>
          <Select id="vps" value={vpsId} onChange={(e) => setVpsId(e.target.value)}>
            <option value="">Nenhuma</option>
            {vpsList?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome ? `${v.nome} (${v.ip})` : v.ip}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">Cadastre VPS na aba VPS para vincular aqui.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="site">Link do site</Label>
          <Input id="site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://meusite.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github">Link do GitHub</Label>
          <Input id="github" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/user/repo" />
        </div>

        <div className="space-y-2">
          <Label>Flags</Label>
          <div className="flex flex-col gap-2">
            {[
              { id: "temAuth", label: "Tem autenticação", checked: temAuth, onChange: setTemAuth },
              { id: "publicavel", label: "Publicável no LinkedIn", checked: publicavel, onChange: setPublicavel },
              ...(isEdit ? [{ id: "arquivado", label: "Arquivado", checked: arquivado, onChange: setArquivado }] : []),
            ].map(({ id, label, checked, onChange }) => (
              <Checkbox
                key={id}
                id={id}
                label={label}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>
            {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar projeto"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Credencial e membros só fazem sentido em projeto já criado */}
      {isEdit && projeto && temAuth && (
        <div className="border-t pt-4">
          <CredencialBox projetoId={projeto.id} temCredencial={projeto.tem_credencial} editable />
        </div>
      )}

      {isEdit && projeto && (
        <div className="border-t pt-4">
          <MembrosList projetoId={projeto.id} membros={projeto.membros} />
        </div>
      )}
    </div>
  )
}
