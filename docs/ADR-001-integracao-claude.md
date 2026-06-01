# ADR-001 — Integração com a Claude: Agent SDK + leitura de `~/.claude/`

**Status:** Aceito · **Contexto:** Fase 1, módulos Agentes/Jobs/Skills.

## Contexto
O requisito C-01 exige que o provedor seja obrigatoriamente a Claude. Não existe API pública da Anthropic para "listar agentes/jobs rodando na conta". O Claude Code roda na mesma VPS e grava estado em `~/.claude/`.

## Decisão
Integrar por duas vias combinadas:
1. **Leitura de disco** de `~/.claude/projects/*.jsonl` (sessões), `~/.claude/todos/*.json` (tarefas/status de agente) e `history.jsonl` — para *visualizar* qualquer execução, inclusive as iniciadas fora do dashboard.
2. **Claude Agent SDK** (`claude-agent-sdk`, Python) para *iniciar, monitorar, parar e modificar* jobs que o próprio dashboard dispara (`ClaudeSDKClient`/`query()`), consumindo eventos de Task tools (TaskCreate/Update/Get/List).

Execuções não iniciadas pelo dashboard são **read-only** (RN-05, FR-045).

## Consequências
- (+) Visão completa de tudo que está na máquina, com controle real do que o dashboard possui.
- (−) Não há "stop" para sessões externas; a UI sinaliza isso.
- Custo: a partir de 15/06/2026 o uso de Agent SDK/`claude -p` consome crédito mensal próprio (ver RISKS e PREREQUISITOS).

## Alternativas descartadas
- Só API Messages (perderia o ecossistema de Claude Code/skills já no disco).
- Só leitura de disco (não permitiria iniciar/parar jobs).
