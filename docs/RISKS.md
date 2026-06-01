# RISKS — Riscos

Escala: Prob/Impacto = Baixo/Médio/Alto.

| ID | Risco | Prob | Impacto | Mitigação |
|---|---|---|---|---|
| R-01 | **Vazamento de dado sensível** em conteúdo do LinkedIn (SSH IP, auth, membros). | Médio | Alto | Denylist absoluta + allowlist `publicavel` + testes RN-04 obrigatórios (ADR-005). Rascunho com preview antes de publicar. |
| R-02 | Claude Code **apaga sessões** antes da ingestão. | Alto | Médio | Ingestor em intervalo curto + upsert idempotente; aumentar frequência se necessário (ADR-002). |
| R-03 | **Custo do Agent SDK**: a partir de 15/06/2026 consome crédito mensal separado; jobs longos podem estourar o limite. | Alto | Médio | Monitorar consumo; limitar nº de jobs simultâneos; alertar no dashboard ao aproximar do limite. |
| R-04 | **Sem controle de execuções externas** (sessões não iniciadas pelo dashboard). | Alto | Baixo | Tratar como read-only e sinalizar na UI (RN-05); incentivar iniciar jobs pelo dashboard. |
| R-05 | **Mudança de formato** dos arquivos `~/.claude/` (JSONL/Task tools) quebra o ingestor. | Médio | Médio | Parser tolerante a falha (NFR-007); versionar o parser; testes com fixtures reais. |
| R-06 | **API do LinkedIn** exige app aprovado e escopos sensíveis; aprovação pode demorar/negar. | Médio | Médio | Fase 2; começar só com rascunho (não depende de publish aprovado); auto-publish só após aprovação. |
| R-07 | **iCloud CalDAV** instável / senha de app revogada. | Médio | Baixo | Tratar Google como caminho principal; registrar SYNC_LOG; reautenticação guiada. |
| R-08 | **Single-user porém exposto na internet** vira alvo. | Médio | Alto | Allowlist de IP + 2FA + rate limit + TLS; manter superfície mínima (ADR-004, NFR-002/003). |
| R-09 | **Perda do Postgres** (VPS sem backup). | Baixo | Alto | Backup periódico do volume; documentar restore. |
| R-10 | Escopo da Fase 2 **inchar** o MVP. | Médio | Médio | Roadmap separa F1/F2; F2 entra só com arquitetura já pronta. |
