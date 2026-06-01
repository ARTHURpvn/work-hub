# TRACEABILITY — Matriz de rastreabilidade

Liga cada requisito à feature do `ROADMAP.md` e ao critério de aceitação/teste. IDs de feature: `FEAT-xx`.

| Requisito | Feature | Critério de aceitação / Teste |
|---|---|---|
| FR-001..004, NFR-002/003 | FEAT-02 | UC-01 (login, 2FA, allowlist de IP); rate limit no /login |
| C-02/03/09, NFR-008/009 | FEAT-01 | docker compose sobe backend+worker+db; Alembic aplica schema base |
| FR-010..015, RN-03 | FEAT-03 | UC-02; testa rejeição de ssh_ip sem VPS; só IP guardado |
| FR-014 | FEAT-03 | membros informativos não autenticam |
| FR-020/021/025 | FEAT-04 | CRUD de tarefa; lista filtra/ordena; fonte única |
| FR-022/023/024, RN-01/02 | FEAT-05 | UC-03; drag atualiza status; retorno de revisão liga flag+contador |
| FR-030 | FEAT-06 | prazos aparecem no calendário interno |
| FR-031/032/033 | FEAT-07 | UC-04; push para Google e iCloud; SYNC_LOG registrado |
| FR-040/041/042/045, NFR-007 | FEAT-08 | UC-05; ingestor idempotente; read-only sinalizado |
| FR-043/044, FR-050/051/052 | FEAT-09 | UC-06; iniciar/parar job próprio; 403 em não-controlável (RN-05) |
| FR-060/061/062 | FEAT-10 | UC-07; lista do disco; cria SKILL.md válido |
| FR-070..074, RN-04 | FEAT-11 (F2) | UC-08; sanitização por origem + denylist; preview WYSIWYG |
| FR-080/081 | FEAT-12 (F2) | sugestões acionáveis; fontes/frequência registradas |
| FR-090/091 | FEAT-13 (F2) | chat de prompts; salvar versões de template |
| NFR-001/004 | FEAT-03, FEAT-11 | segredos cifrados/fora do banco; denylist barra dados sensíveis |
| NFR-005 | todas de UI | responsivo 360px→desktop; Kanban em toque |
| NFR-006 | FEAT-04/05/08 | lista < 1,5 s com 1.000 tarefas; status ≤ 5 s |
| NFR-010 | FEAT-01/09 | logs estruturados; histórico de jobs/sync consultável |
