# PROJECT — Dashboard Pessoal de Trabalho (`workhub`)

> **Visão em uma frase:** um dashboard pessoal único que conecta projetos → tarefas (lista e Kanban) → prazos → agentes/jobs/skills da Claude, com automações de LinkedIn e melhoria de prompts numa fase posterior.

Esta é a **porta de entrada** para a IA construtora. Leia este arquivo primeiro; ele mapeia todo o resto.

## Stack (resumo)
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2.
- **Integração Claude:** `claude-agent-sdk` + leitura de `~/.claude/` (provedor obrigatoriamente Claude).
- **Worker:** asyncio + APScheduler; fila de jobs no Postgres (sem Redis no MVP).
- **Frontend:** Vite + React + TypeScript + Tailwind + shadcn/ui + dnd-kit + TanStack Query.
- **Dados:** PostgreSQL 16 (Docker). **Deploy:** Docker Compose na VPS + reverse proxy com TLS e allowlist de IP.

## Convenções
- Requisitos com ID (`FR-`/`NFR-`), prioridade MoSCoW, verificáveis. Rastreabilidade liga requisito → feature → teste.
- Decisões não tomadas viram **Questão em aberto**, nunca chute.
- Segurança: só o **IP** do SSH é guardado; segredos reais ficam fora do app; denylist barra dados sensíveis no conteúdo público.
- Português técnico; termos de indústria em inglês.
- Quando o usuário não especificar, puxar os defaults de stack deste arquivo / `ARCHITECTURE.md`.

## Mapa dos documentos (`docs/`)
| Arquivo | O que é |
|---|---|
| `VISION.md` | Visão, escopo, objetivos e não-objetivos. |
| `SRS.md` | Requisitos (FR/NFR), MoSCoW, regras de negócio (RN), restrições, premissas, questões em aberto. **Coração.** |
| `GLOSSARY.md` | Termos do domínio (agente, job, skill, origem, sanitização...). |
| `USE_CASES.md` | Casos de uso (diagrama + Gherkin). |
| `ARCHITECTURE.md` | Componentes (diagrama), camadas e decisões. |
| `DATA_MODEL.md` | ER (Mermaid) + dicionário de dados. |
| `API.md` | Contrato dos endpoints REST. |
| `adr/ADR-001..005` | Decisões técnicas (integração Claude, ingestão, fila de jobs, credenciais, sanitização). |
| `TEST_STRATEGY.md` | Níveis e casos de teste obrigatórios. |
| `TRACEABILITY.md` | Matriz requisito → feature → teste. |
| `RISKS.md` | Riscos (prob × impacto × mitigação). |
| `ROADMAP.md` | Features em ordem, cada uma pronta para `/feature`. |
| `PREREQUISITOS.md` | **Checklist do que o usuário precisa providenciar.** |

## Próximo passo
Rodar os itens do `ROADMAP.md` em ordem com `/feature`, começando por **FEAT-01 (Fundação)**. Antes do FEAT-02 em diante, conferir a **Etapa 1** do `PREREQUISITOS.md` (Claude/SDK) e responder às **Questões em aberto** do `SRS.md`.
