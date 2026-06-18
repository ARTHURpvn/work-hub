import { useState } from "react"
import type { StoreServer } from "@/api/mcpStore"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { Button, Empty, Field, TextInput } from "@/components/ui/kit"
import { useMcpDocs, useMcpImport, useMcpStoreSearch } from "@/hooks/useMcpStore"
import { toast } from "@/store/toastStore"

function copiar(texto: string, msg: string) {
  navigator.clipboard.writeText(texto).then(
    () => toast.success(msg),
    () => toast.error("Não foi possível copiar"),
  )
}

export function McpStore() {
  const [q, setQ] = useState("")
  const [ativo, setAtivo] = useState("")
  const [aberto, setAberto] = useState<StoreServer | null>(null)
  const { data, isFetching, isFetchingNextPage, isError, hasNextPage, fetchNextPage } = useMcpStoreSearch(ativo)

  const all = (data?.pages ?? []).flatMap((p) => p.servers)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="t-display">MCP Store</h1>
          <div className="sub">Busque MCPs no registro oficial e importe pro workhub ou copie o comando de instalação</div>
        </div>
      </div>

      <div
        className="card card-pad"
        style={{ borderColor: "var(--warning, #b8860b)", marginBottom: 14, display: "flex", gap: 10 }}
      >
        <Icon name="alert" size={18} />
        <div className="sub" style={{ margin: 0 }}>
          MCP executa código na sua máquina. Confira <b>origem</b>, <b>transporte</b> e os <b>env</b> exigidos antes de instalar.
          O workhub nunca executa nada — só gera o comando / importa a config.
        </div>
      </div>

      <form
        className="row wrap"
        style={{ gap: 8, marginBottom: 16 }}
        onSubmit={(e) => {
          e.preventDefault()
          setAtivo(q.trim())
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <TextInput placeholder="Buscar (ex.: postgres, github, playwright)…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button type="submit" variant="primary" icon="search">Buscar</Button>
      </form>

      {isError && (
        <div className="card card-pad" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
          Erro ao consultar o registro. Tente de novo em instantes.
        </div>
      )}
      {isFetching && !isFetchingNextPage && all.length === 0 && <p className="muted">Buscando…</p>}

      {!isFetching && !isError && all.length === 0 && (
        <div className="card card-pad">
          <Empty icon="search" title="Nenhum resultado">
            Digite uma palavra-chave e clique em Buscar.
          </Empty>
        </div>
      )}

      {all.length > 0 && (
        <>
          <div className="nav-label" style={{ padding: "0 2px 8px" }}>
            {ativo ? `Resultados para “${ativo}”` : "Sugestões do registro oficial"}
          </div>
          <div className="grid g-3">
            {all.map((s) => (
              <div key={`${s.name}@${s.version}`} className="card card-pad card-hover" onClick={() => setAberto(s)}>
                <div className="spread" style={{ marginBottom: 10 }}>
                  <div className="row" style={{ gap: 9, minWidth: 0 }}>
                    <div className="avatar" style={{ borderRadius: 9, background: "var(--accent-weak)", color: "var(--accent)", border: "none" }}>
                      <Icon name="link" size={15} />
                    </div>
                    <span className="truncate" style={{ fontWeight: 700 }}>{s.title || s.suggested_name}</span>
                  </div>
                  {s.package_kind && <span className="tag tag-otavio"><span className="dot" /> {s.package_kind}</span>}
                </div>
                <div className="t-meta mono truncate" style={{ marginBottom: 6 }}>{s.name}</div>
                <div className="sub" style={{ margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
                  {s.description || "Sem descrição."}
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <Button type="button" variant="ghost" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                {isFetchingNextPage ? "Carregando…" : "Carregar mais"}
              </Button>
            </div>
          )}
        </>
      )}

      {aberto && <DetailModal server={aberto} onClose={() => setAberto(null)} />}
    </div>
  )
}

function DetailModal({ server, onClose }: { server: StoreServer; onClose: () => void }) {
  const importar = useMcpImport()
  const [nameLocal, setNameLocal] = useState(server.suggested_name)
  const { data: doc, isFetching: docLoading } = useMcpDocs(server.package_kind, server.package_id)

  function doImport() {
    importar.mutate(
      { name: server.name, nameLocal: nameLocal.trim() || undefined },
      {
        onSuccess: (r) => {
          toast.success(`Importado como "${r.name}"`, "Disponível na página MCP")
          onClose()
        },
        onError: (e) => toast.error("Erro ao importar", e instanceof Error ? e.message : undefined),
      },
    )
  }

  const snippet = JSON.stringify(server.mcp_json, null, 2)
  const descricaoCompleta = doc?.description || server.description

  return (
    <Modal onClose={onClose} title={server.title || server.suggested_name} size="lg">
      <div className="stack" style={{ gap: 12 }}>
        <div className="t-meta mono">{server.name}{server.version ? ` · v${server.version}` : ""}</div>
        {descricaoCompleta && <p className="sub" style={{ margin: 0 }}>{descricaoCompleta}</p>}

        <div className="row wrap" style={{ gap: 6 }}>
          <span className="tag"><span className="dot" /> {server.transport}</span>
          {server.package_kind && <span className="tag tag-otavio"><span className="dot" /> {server.package_kind}</span>}
        </div>

        {(server.docs.length > 0 || doc?.homepage) && (
          <Field label="Documentação">
            <div className="row wrap" style={{ gap: 6 }}>
              {server.docs.map((d) => (
                <a key={d.url} href={d.url} target="_blank" rel="noreferrer" className="tag" style={{ textDecoration: "none" }}>
                  <Icon name="external" size={12} /> {d.label}
                </a>
              ))}
              {doc?.homepage && !server.docs.some((d) => d.url === doc.homepage) && (
                <a href={doc.homepage} target="_blank" rel="noreferrer" className="tag" style={{ textDecoration: "none" }}>
                  <Icon name="external" size={12} /> site
                </a>
              )}
            </div>
          </Field>
        )}

        {(server.command || server.url) && (
          <Field label="Execução">
            <div className="mono sub" style={{ margin: 0, wordBreak: "break-all" }}>
              {server.url ? server.url : [server.command, ...server.args].join(" ")}
            </div>
          </Field>
        )}

        {server.env_required.length > 0 && (
          <Field label="Variáveis de ambiente exigidas">
            <div className="stack" style={{ gap: 4 }}>
              {server.env_required.map((e) => (
                <div key={e.name} className="row" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontWeight: 600 }}>{e.name}</span>
                  {e.secret && <span className="tag" style={{ color: "var(--danger)" }}><Icon name="key" size={11} /> secret</span>}
                  {e.description && <span className="sub truncate" style={{ margin: 0 }}>— {e.description}</span>}
                </div>
              ))}
            </div>
          </Field>
        )}

        {(docLoading || doc?.readme) && (
          <Field label="Documentação do pacote">
            {docLoading && !doc?.readme ? (
              <p className="muted" style={{ margin: 0 }}>Carregando README…</p>
            ) : (
              <div
                className="sub mono"
                style={{ margin: 0, maxHeight: 220, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                         padding: "8px 10px", background: "var(--surface-2, rgba(127,127,127,.08))", borderRadius: 8, fontSize: 12 }}
              >
                {doc?.readme}
              </div>
            )}
          </Field>
        )}

        <Field label="Comando de instalação" hint="Cole no terminal. O workhub não executa nada.">
          <div className="mono sub" style={{ margin: 0, wordBreak: "break-all", padding: "8px 10px", background: "var(--surface-2, rgba(127,127,127,.08))", borderRadius: 8 }}>
            {server.install_command}
          </div>
        </Field>

        <div className="row wrap" style={{ gap: 8 }}>
          <Button type="button" variant="ghost" size="sm" icon="copy" onClick={() => copiar(server.install_command, "Comando copiado")}>
            Copiar comando
          </Button>
          <Button type="button" variant="ghost" size="sm" icon="copy" onClick={() => copiar(snippet, ".mcp.json copiado")}>
            Copiar .mcp.json
          </Button>
        </div>

        <div className="nav-sep" />

        <Field label="Importar pro workhub (name local)" hint="Cria um MCP em /mcp; segredos exigidos entram cifrados e vazios pra você preencher.">
          <TextInput value={nameLocal} onChange={(e) => setNameLocal(e.target.value)} placeholder="nome-local" />
        </Field>
        <div className="row" style={{ gap: 8 }}>
          <Button type="button" variant="primary" icon="download" disabled={importar.isPending} onClick={doImport}>
            {importar.isPending ? "Importando…" : "Importar pro workhub"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </Modal>
  )
}
