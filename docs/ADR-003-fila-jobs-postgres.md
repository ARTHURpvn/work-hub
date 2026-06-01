# ADR-003 — Fila de jobs no Postgres (sem Redis no MVP)

**Status:** Aceito · **Contexto:** FR-043/050/051, NFR-009.

## Contexto
Há jobs (agentes, ingestão, sync, cron de LinkedIn na Fase 2). Single-user numa VPS — minimizar peças de infra.

## Decisão
Usar a tabela `JOB` como fila, consumida pelo worker com `SELECT ... FOR UPDATE SKIP LOCKED`. Agendamento de crons via **APScheduler** no worker. **Sem Redis** no MVP.

## Consequências
- (+) Menos um serviço para operar/instalar (sem Redis).
- (+) Transações e histórico no mesmo banco.
- (−) Throughput menor que um broker dedicado — irrelevante para 1 usuário.
- **Caminho de escala:** migrar para Redis + ARQ se o volume de jobs crescer.
