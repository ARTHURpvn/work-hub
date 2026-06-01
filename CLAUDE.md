# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**dash-pvn** (codinome `workhub`) — dashboard pessoal que conecta projetos → tarefas (lista e Kanban) → prazos → agentes/jobs/skills da Claude Code, com automações de LinkedIn e melhoria de prompts em fase posterior.

**Estado atual:** FEAT-01 a FEAT-05 implementadas. A implementação segue o roadmap em `docs/ROADMAP.md`, feature por feature via `/feature`.

## Comandos

```bash
# Docker (modo principal — local e produção)
docker compose up -d               # sobe todos os serviços
docker compose logs -f api         # logs do backend
docker compose logs -f worker      # logs do worker
docker compose down -v             # para e apaga volumes

# Backend (fora do Docker — para desenvolvimento pontual)
cd api
pip install -r requirements.txt
uvicorn app.main:app --reload      # sobe em :8000
alembic upgrade head               # aplica migrations
alembic revision --autogenerate -m "<desc>"  # gera nova migration

# Testes (não requerem banco real — usam mocks e AsyncMock)
python3 -m pytest tests/ -v                                        # todos os testes
python3 -m pytest tests/test_tarefa_service.py -v                  # arquivo específico
python3 -m pytest tests/test_tarefa_service.py::test_rn02_saindo_de_revisao_para_a_fazer -v  # teste único

# Frontend
npm run dev       # dev server com HMR em :5173 (proxy /api → :8000)
npm run build     # tsc -b && vite build
npm run lint      # ESLint
npm run preview   # serve o build local
```

## Stack

| Camada | Tecnologias |
|---|---|
| Frontend | Vite 8, React 19, TypeScript 6, Tailwind 4, shadcn/ui (componentes copiados), Zustand (UI + auth state), TanStack Query (server state), React Router 7 |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0 async, Alembic, Pydantic v2, Starlette SessionMiddleware (cookie stateless), slowapi (rate limit), argon2-cffi, pyotp |
| Worker | asyncio, APScheduler, `claude-agent-sdk` (stub — implementar em FEAT-08/09) |
| Banco | PostgreSQL 16 (container Docker, volume persistente) |
| Proxy | Caddy 2 (IP allowlist via `remote_ip`, proxy reverso; rate limit de login no backend via slowapi) |

## Estrutura do projeto

```
dash-pvn/
├── docker-compose.yml              # produção
├── docker-compose.override.yml     # dev: expõe porta 8000
├── .env.example                    # copiar → .env (nunca commitar .env)
├── proxy/
│   └── Caddyfile
├── api/                            # FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/001_initial_schema.py   # todas as 12 tabelas
│   ├── tests/                      # pytest
│   └── app/
│       ├── main.py                 # app FastAPI, middlewares, routers
│       ├── config.py               # Settings (pydantic-settings, lê .env)
│       ├── database.py             # engine async + get_session()
│       ├── deps.py                 # get_current_user (verifica sessão)
│       ├── models/                 # SQLAlchemy ORM (um arquivo por domínio)
│       ├── routers/                # endpoints REST
│       ├── schemas/                # Pydantic (request/response)
│       └── services/               # lógica de negócio
├── worker/
│   ├── Dockerfile
│   └── main.py                     # stub asyncio — aguarda FEAT-08/09
└── src/                            # Frontend React
    ├── api/                        # fetch wrappers tipados (auth.ts, projetos.ts, tarefas.ts)
    ├── components/
    │   ├── layout/                 # AppLayout.tsx, Sidebar.tsx
    │   ├── projetos/               # ProjetoCard, ProjetoForm, MembrosList
    │   └── ui/                     # componentes shadcn copiados
    ├── hooks/                      # TanStack Query hooks (useProjetos.ts, useTarefas.ts)
    ├── pages/                      # Dashboard, Login, Projetos, Tarefas, Kanban
    └── store/                      # Zustand: authStore.ts, uiStore.ts, tarefaStore.ts (filtros)
```

## Arquitetura

Quatro serviços no `docker compose`: `proxy`, `api`, `worker`, `db`.

**Worker** é o processo mais crítico — roda três sub-rotinas (stub por enquanto):
1. **Ingestor**: lê `~/.claude/projects/*.jsonl`, `~/.claude/todos/*.json` e `history.jsonl`; faz upsert idempotente por `session_uuid` no Postgres.
2. **Job runner**: inicia/para agentes via `claude-agent-sdk`; transmite eventos de Task tools para a tabela `JOB`.
3. **Scheduler** (APScheduler): crons de ingestão periódica e, na Fase 2, LinkedIn.

**Frontend** nunca lê `~/.claude/` diretamente — sempre via API FastAPI que reflete o que o Worker gravou no Postgres.

A flag `AGENTE.controlavel = true` é definida exclusivamente quando o dashboard iniciou o agente (fonte `sdk`). Agentes lidos do disco são read-only; tentar parar um não-controlável retorna 403.

## Convenções de código

### Backend
- Base da API REST: `/api/v1`. Todos os endpoints exigem sessão (cookie `session` HttpOnly), exceto `POST /auth/login`.
- Erros retornam o formato padrão do FastAPI: `{ "detail": "mensagem" }`. O formato `{ "error": { "code": "...", "message": "..." } }` documentado em `API.md` é o target futuro — quando implementado, adicionar exception handler global em `main.py`.
- Session: Starlette `SessionMiddleware` com cookie assinado (itsdangerous). Sessão contém `user_id` e `expires_at`. Verificação em `app/deps.py:get_current_user`.
- `PROJETO.ssh_ip` armazena **só o IP** (validado com `ipaddress.ip_address()`). Se `tem_vps = false`, o campo deve ser `NULL` (RN-03 — validado no Pydantic com `model_validator`). Jamais armazenar chave, usuário, porta ou senha de SSH.
- `*.publicavel` é a allowlist para o pipeline de LinkedIn — sem essa flag, o item nunca entra em conteúdo público (RN-04).
- Credentials de calendário e `totp_secret` cifrados em repouso com chave vinda de `ENCRYPTION_KEY` no `.env`, **nunca no banco em claro**.
- Fila de jobs no Postgres com `FOR UPDATE SKIP LOCKED` — sem Redis no MVP (ver ADR-003).
- **Padrão flush/commit**: services fazem `await session.flush()` (propaga ao banco sem commitar); routers fazem `await session.commit()` após chamar o service. Não usar `session.begin()` explícito (o `get_session()` gerencia o ciclo).
- **Enums de domínio**:
  - `Tarefa.status`: `"A Fazer"`, `"Em Andamento"`, `"Em Revisao"`, `"Concluido"`
  - `Tarefa.prioridade`: `"baixa"`, `"media"`, `"alta"`
  - `Projeto.origem`: `"Otavio"`, `"Titan"`, `"Freelas"`
- **RN-02 — revisão de tarefas**: ao mover de `Em Revisao` → `A Fazer`/`Em Andamento`, o campo `revisao_retornos` incrementa e `retornou_de_revisao` é marcado `true`. Ao concluir, `retornou_de_revisao` é resetado. Lógica exclusivamente em `tarefa_service.update_status()`.

### Frontend
- Alias de path: `@/` aponta para `src/`. Ex: `import { cn } from "@/lib/utils"`.
- **Zustand** para estado de UI e sessão (`authStore`, `uiStore`) e filtros de lista (`tarefaStore`). **TanStack Query** para estado do servidor (fetch, cache, invalidação).
- Componentes shadcn/ui ficam em `src/components/ui/` — copiados e editáveis, não instalados via CLI.
- Hooks de dados em `src/hooks/` (ex: `useTarefas.ts`). Funções de fetch em `src/api/` (ex: `tarefas.ts`).
- **Rotas**: `/login` (público), `/` (Dashboard), `/projetos`, `/tarefas`, `/kanban`. Todas exceto `/login` passam por `ProtectedRoute`.
- **Update otimista no Kanban**: `useUpdateStatus()` em `useTarefas.ts` implementa optimistic update com rollback via `onMutate`/`onError` do TanStack Query.

## Ordem de implementação

| Status | Feature |
|---|---|
| ✅ Concluída | FEAT-01 — Docker + Alembic + layout frontend |
| ✅ Concluída | FEAT-02 — Auth (Argon2 + cookie + TOTP + rate limit + IP allowlist) |
| ✅ Concluída | FEAT-03 — Projetos (CRUD + RN-03 + membros) |
| ✅ Concluída | FEAT-04 — Tarefas (CRUD lista + filtros + RN-02) |
| ✅ Concluída | FEAT-05 — Kanban (dnd-kit, touch, update otimista, RN-02) |
| ⏳ Próxima | FEAT-06 — Calendário interno |
| ⏳ | FEAT-07 — Sync Google/iCloud |
| ⏳ | FEAT-08 — Agentes (ingestão + visualização) |
| ⏳ | FEAT-09 — Jobs via SDK |
| ⏳ | FEAT-10 — Skills |
| 🔮 Fase 2 | FEAT-11..13 — LinkedIn + chat de prompts |

Use `/feature` para iniciar qualquer feature — o brief completo está no `docs/ROADMAP.md`.

## Documentação relevante em `docs/`

| Arquivo | Uso |
|---|---|
| `PROJECT.md` | Porta de entrada; mapa de todo o resto |
| `ARCHITECTURE.md` | Diagrama de componentes + decisões-chave |
| `DATA_MODEL.md` | ER Mermaid + dicionário de dados |
| `API.md` | Contrato completo dos endpoints REST |
| `ROADMAP.md` | Features em ordem para `/feature` |
| `PREREQUISITOS.md` | Checklist do que o usuário precisa configurar (infra, OAuth, segredos) |
| `ADR-001..005` | Decisões técnicas (integração Claude, ingestão, fila, credenciais, sanitização LinkedIn) |
| `SRS.md` | Requisitos FR/NFR com IDs rastreáveis |
