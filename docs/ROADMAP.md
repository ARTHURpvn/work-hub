# ROADMAP — Ordem de construção

Cada item é um **brief pronto para `/feature`**, na ordem de dependência (infra/auth antes do resto). O `/feature` clarifica o detalhe fino.

## Fase 1 — Núcleo

### FEAT-01 — Fundação (infra + esqueleto)
Subir `docker compose` (proxy, backend FastAPI, worker, Postgres 16). Configurar SQLAlchemy 2.0 + Alembic (migration base com todas as tabelas do `DATA_MODEL.md`). Frontend Vite+React+TS+Tailwind+shadcn/ui com layout responsivo e navegação. **Dep:** nenhuma. **Cobre:** C-02/03/04/09, NFR-008/009.

### FEAT-02 — Autenticação & endurecimento
Login single-user (Argon2), sessão por cookie HttpOnly+Secure, 2FA TOTP opcional, allowlist de IP e rate limit no proxy. **Dep:** FEAT-01. **Cobre:** FR-001..004, NFR-002/003. **Aceite:** UC-01.

### FEAT-03 — Projetos
CRUD de projetos com origem (Otávio/Titan/Freelas), tem_autenticacao, tem_vps + `ssh_ip` (só IP, RN-03), `publicavel`, membros informativos. **Dep:** FEAT-02. **Cobre:** FR-010..015, NFR-001/004. **Aceite:** UC-02.

### FEAT-04 — Tarefas (visão lista)
CRUD de tarefa (título, descrição, prazo, prioridade, projeto opcional, status). Lista com filtros/ordenção. Fonte única para as duas visões. **Dep:** FEAT-03. **Cobre:** FR-020/021/025.

### FEAT-05 — Kanban (mesma fonte)
Board com colunas A Fazer/Em Andamento/Em Revisão/Concluído; drag com dnd-kit atualiza `status` (mesma tarefa do FEAT-04). Regra de retorno de revisão (flag + contador, RN-02). **Dep:** FEAT-04. **Cobre:** FR-022/023/024. **Aceite:** UC-03.

### FEAT-06 — Calendário interno
Exibir prazos das tarefas num calendário. **Dep:** FEAT-04. **Cobre:** FR-030.

### FEAT-07 — Sync de calendário (Google + iCloud)
Push de prazos para Google Calendar (OAuth) e iCloud (CalDAV/senha de app); SYNC_LOG; tokens cifrados. **Dep:** FEAT-06. **Cobre:** FR-031/032/033. **Aceite:** UC-04.

### FEAT-08 — Agentes (ingestão + visualização)
Ingestor no worker lê `~/.claude/` e faz upsert idempotente; tela lista agentes com status/fonte/projeto; organização (favoritar/agrupar); read-only para execuções externas. **Dep:** FEAT-03. **Cobre:** FR-040/041/042/045, NFR-007. **Aceite:** UC-05.

### FEAT-09 — Jobs (controle via Agent SDK)
Iniciar agente via `claude-agent-sdk`; fila de jobs no Postgres + APScheduler; parar/pausar/retomar/cancelar/editar params; logs e histórico; 403 em não-controlável. **Dep:** FEAT-08. **Cobre:** FR-043/044, FR-050/051/052, RN-05. **Aceite:** UC-06.

### FEAT-10 — Skills (listar + criar)
Listar skills de `~/.claude/skills`, `.claude/skills` e plugins (cache em SKILL_REF); criar skill nova gerando pasta + SKILL.md com frontmatter validado. **Dep:** FEAT-08. **Cobre:** FR-060/061/062. **Aceite:** UC-07.

## Fase 2 — Automação (arquitetura já pronta)

### FEAT-11 — Cron de publicação no LinkedIn
Job agendado gera rascunho a partir de itens `publicavel`, com pipeline de sanitização (ADR-005/RN-04) e system prompts versionados; preview WYSIWYG; alternância para auto-publish via API oficial após liberação. **Dep:** FEAT-03, FEAT-09. **Cobre:** FR-070..074. **Aceite:** UC-08.

### FEAT-12 — Avaliação contínua do LinkedIn
Avaliação periódica (frequência configurável) de perfil/posts com sugestões acionáveis; registra fontes/frequência. **Dep:** FEAT-11. **Cobre:** FR-080/081. **Obs:** depende de Q-02.

### FEAT-13 — Chat de melhoria de prompts
Chat para refinar/testar prompts via API Claude; salvar versões de template (reaproveitadas em FEAT-11). **Dep:** FEAT-01. **Cobre:** FR-090/091.

---
**Sugestão de marcos:** M1 = FEAT-01→03 (fundação utilizável); M2 = FEAT-04→07 (tarefas + agenda); M3 = FEAT-08→10 (Claude integrado) = **fim do MVP**; M4 = FEAT-11→13 (Fase 2).
