import { ExternalLink, LinkIcon, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLinks } from "@/hooks/useTarefas"
import type { TarefaLink } from "@/api/tarefas"

interface Props {
  tarefaId: string
  links: TarefaLink[]
}

export function LinksBox({ tarefaId, links }: Props) {
  const { add, remove } = useLinks()
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!label.trim() || !url.trim()) {
      setError("Preencha rótulo e URL")
      return
    }
    add.mutate(
      { tarefaId, label: label.trim(), url: url.trim() },
      {
        onSuccess: () => { setLabel(""); setUrl(""); setOpen(false) },
        onError: (err) => setError(err instanceof Error ? err.message : "Erro ao adicionar"),
      }
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Links</p>

      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.id} className="group flex items-center gap-2 text-sm">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center gap-1 truncate text-primary hover:underline"
            >
              {l.label}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            <button
              onClick={() => remove.mutate({ tarefaId, linkId: l.id })}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Remover link"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <form onSubmit={handleAdd} className="space-y-2 rounded-md border p-2">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo (ex.: Figma)" className="h-9" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="h-9" />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={add.isPending}>Adicionar</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar link
        </Button>
      )}
    </div>
  )
}
