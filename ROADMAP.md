# Roadmap — workhub como gerenciador de plugins do Claude Code

Visão: evoluir o workhub de "gerenciador de skills" para **gerenciador de plugins**,
onde cada workflow vira uma unidade coerente e versionada (skill + MCP + hook +
subagent + command), seguindo o modelo das 5 peças do Claude:

- **CLAUDE.md** = contexto sempre-presente
- **skills** = procedimento (sob demanda)
- **MCP** = acesso a dados externos
- **subagents** = isolamento de contexto
- **hooks** = automação determinística

Decisões firmadas:
- Persistência: **tabela por tipo + espelho local** (`~/.claude/...`).
- Só **skills** sobem para a Skill Management API; os demais construtos vivem no
  filesystem e/ou no bundle do plugin.
- **Sempre confirmar o formato real na doc oficial antes de implementar** cada
  construto (o `claude plugin validate` já pegou bug de frontmatter).

---

## v1 — Export de plugin ✅ (entregue)
- Skills multi-arquivo (progressive disclosure) + espelho local automático.
- Tabela `plugin` + `plugin_skill`; `plugin_export_service` monta
  marketplace → plugin → skills, valida via `claude plugin validate --strict`
  e exporta `.zip`. Página **Plugins** no front.
- Instalação: `/plugin marketplace add <pasta>` → `/plugin install <nome>@<mkt>`.

## v2 — Plugin como unidade completa ✅ (entregue)
Fatiado (cada fatia = um ciclo `/feature`):

- **v2a — Subagents** ✅: CRUD + geração por IA; espelho em
  `~/.claude/agents/<name>.md`; export no bundle (`agents/`).
- **v2b — MCP-usage** ✅: cadastro de MCP servers (segredos cifrados/mascarados),
  vínculo skill↔MCP e plugin↔MCP, `.mcp.json` no bundle (placeholders `${KEY}`).
- **v2c — Hooks** ✅: CRUD (evento + matcher + comando) → `hooks/hooks.json` no
  bundle (bundle-only; workhub não executa). Espelho em `settings.json` segue
  como sub-etapa opt-in futura (ponto destrutivo: merge + backup + idempotência).
- **v2d — Commands** ✅: slash commands → `commands/<name>.md` no bundle + espelho
  em `~/.claude/commands`. O editor de Plugin reúne as 5 peças.

## v3 — MCP Store ✅ (entregue)
- Browse/busca do **registry oficial** (`registry.modelcontextprotocol.io`,
  `GET /v0/servers?search=`) via backend-proxy (`mcp_store_service`: timeout 10s +
  cache TTL 5min + dedup por nome).
- **Opção leve (entregue):** página **MCP Store** lista/detalha servers (origem,
  transporte, pacote npm/pypi/oci/remote, env exigidos) e gera `claude mcp add` +
  snippet `.mcp.json` para copiar. Importação pro `mcp_server` re-busca no registry
  (fonte da verdade), cifra segredos exigidos (vazios) e barra colisão (409).
- **Opção integrada (futuro):** merge automático no `~/.claude.json`.
- Segurança: workhub nunca executa; host fixo (sem SSRF), httpx sem
  follow-redirects, endpoints sob auth, banner de aviso na tela.

## v4 — Advisor de MCP (capstone)
Motor de recomendação que cruza **store × skills/plugins × o seu código**:
- IA roda periodicamente (rotina/cron), detecta MCP novo/relevante
  (`updated_since` no registry) e analisa os repos para inferir necessidade.
- Cada recomendação: **qual MCP → em qual skill usar → por quê** + `mcpServers`
  pronto + sugestão de edição da skill ensinando o uso.
- Caixa de "Recomendações" no workhub; 1 clique = instalar (v3) + aplicar edição
  na skill (assistente atual). Depende de v2b + v3.
