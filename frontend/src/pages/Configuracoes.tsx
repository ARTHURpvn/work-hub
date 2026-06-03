import { useState } from "react"
import type { ConfigItem } from "@/api/config"
import { Icon } from "@/components/ui/Icon"
import { Button, IconButton } from "@/components/ui/kit"
import { useConfig, useConfigMutations } from "@/hooks/useConfig"
import { confirm } from "@/store/confirmStore"
import { toast } from "@/store/toastStore"

export function Configuracoes() {
  const { data: itens, isLoading, isError } = useConfig()

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <div>
          <h1 className="t-display">Configurações</h1>
          <div className="sub">Suas chaves de API e preferências de integração</div>
        </div>
      </div>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao carregar as configurações.
        </div>
      )}
      {isLoading && <p className="muted">Carregando…</p>}

      <div className="stack" style={{ gap: 16 }}>
        {(itens ?? []).map((item) => (
          <ConfigRow key={item.chave} item={item} />
        ))}
      </div>

      <p className="t-meta" style={{ marginTop: 18 }}>
        <Icon name="lock" size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
        Chaves secretas são cifradas no servidor e nunca exibidas de volta — só a máscara.
      </p>
    </div>
  )
}

function ConfigRow({ item }: { item: ConfigItem }) {
  const { set, remove } = useConfigMutations()
  const [valor, setValor] = useState(item.secret ? "" : item.valor ?? "")
  const [show, setShow] = useState(false)

  function salvar() {
    const v = valor.trim()
    if (!v) {
      toast.error("Informe um valor")
      return
    }
    set.mutate(
      { chave: item.chave, valor: v },
      {
        onSuccess: () => {
          toast.success(`${item.label} salva`)
          if (item.secret) setValor("")
        },
        onError: (e) => toast.error("Erro ao salvar", e instanceof Error ? e.message : undefined),
      }
    )
  }

  async function remover() {
    const ok = await confirm({
      title: `Remover ${item.label}?`,
      description: "A configuração será apagada do servidor.",
      confirmLabel: "Remover",
      destructive: true,
    })
    if (!ok) return
    remove.mutate(item.chave, {
      onSuccess: () => {
        toast.success("Removida")
        setValor("")
      },
      onError: (e) => toast.error("Erro ao remover", e instanceof Error ? e.message : undefined),
    })
  }

  return (
    <div className="card card-pad">
      <div className="spread" style={{ marginBottom: 4 }}>
        <div className="row" style={{ gap: 9 }}>
          <div
            className="avatar"
            style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}
          >
            <Icon name={item.secret ? "key" : "settings"} size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{item.label}</div>
            <div className="t-meta mono">{item.chave}</div>
          </div>
        </div>
        {item.configurado ? (
          <span className="pill pill-done">
            <span className="dot" /> Configurado
          </span>
        ) : (
          <span className="pill pill-todo">
            <span className="dot" /> Não definido
          </span>
        )}
      </div>

      {item.ajuda && (
        <p className="muted" style={{ fontSize: 13, margin: "6px 0 12px" }}>
          {item.ajuda}
        </p>
      )}

      {item.secret && item.configurado && (
        <div className="t-meta mono" style={{ marginBottom: 8 }}>
          Atual: {item.mascara}
        </div>
      )}

      <div className="input-group">
        {item.secret ? (
          <div className="input-icon" style={{ flex: 1 }}>
            <Icon name="lock" />
            <input
              className="input"
              type={show ? "text" : "password"}
              value={valor}
              placeholder={item.configurado ? "Inserir nova chave…" : item.placeholder}
              onChange={(e) => setValor(e.target.value)}
              style={{ paddingRight: 40 }}
              autoComplete="off"
            />
            <IconButton
              name={show ? "eyeoff" : "eye"}
              size={16}
              className="input-affix"
              style={{ width: 30, height: 30 }}
              onClick={() => setShow((s) => !s)}
              tabIndex={-1}
            />
          </div>
        ) : (
          <input
            className="input"
            value={valor}
            placeholder={item.placeholder}
            onChange={(e) => setValor(e.target.value)}
            style={{ flex: 1 }}
          />
        )}
        <Button variant="primary" icon="check" onClick={salvar} disabled={set.isPending}>
          Salvar
        </Button>
        {item.configurado && item.secret && (
          <Button variant="danger" icon="trash" onClick={remover} disabled={remove.isPending}>
            Remover
          </Button>
        )}
      </div>
    </div>
  )
}
