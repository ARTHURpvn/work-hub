# ADR-002 — Ingestão de sessões/skills para o Postgres

**Status:** Aceito · **Contexto:** FR-041, NFR-007.

## Contexto
O Claude Code **apaga sessões antigas automaticamente**. Ler o disco em tempo real perderia histórico e seria frágil para consultas/filtros.

## Decisão
Um **ingestor** no worker lê `~/.claude/` periodicamente e faz **upsert idempotente** no Postgres usando `session_uuid` como chave. A UI lê sempre do Postgres, nunca do disco. Arquivos malformados são logados e pulados sem derrubar o worker.

## Consequências
- (+) Histórico durável, consultas rápidas, filtros por projeto/status.
- (+) Resiliência à limpeza do Claude Code.
- (−) Pequena defasagem (intervalo de ingestão); aceitável (NFR-006: ≤ 5 s para status).
