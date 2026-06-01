# API — Contrato (REST, FastAPI)

Base: `/api/v1`. Autenticação por sessão (cookie HttpOnly) após login. Todos os endpoints exigem sessão, exceto `POST /auth/login`. Respostas em JSON; erros no formato `{ "error": { "code": "...", "message": "..." } }`.

## Auth
| Método | Rota | Descrição | Req |
|---|---|---|---|
| POST | `/auth/login` | Login com senha (+ TOTP se ativo). Aplica allowlist de IP e rate limit. | FR-001..003 |
| POST | `/auth/logout` | Encerra a sessão. | FR-001 |
| GET | `/auth/me` | Dados da sessão atual. | FR-001 |

## Projetos
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/projetos` | Lista projetos (filtro por origem, arquivado). | FR-010/011 |
| POST | `/projetos` | Cria projeto. Valida RN-03 (ssh_ip só com tem_vps). | FR-010..013 |
| GET | `/projetos/{id}` | Detalhe. | FR-010 |
| PATCH | `/projetos/{id}` | Edita (inclui `publicavel`). | FR-010/013 |
| POST | `/projetos/{id}/membros` | Adiciona membro informativo. | FR-014 |
| DELETE | `/projetos/{id}/membros/{mid}` | Remove membro. | FR-014 |

## Tarefas
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/tarefas` | Lista (filtros: status, projeto, prazo; ordenação). Fonte única das duas visões. | FR-020/021/025 |
| POST | `/tarefas` | Cria tarefa. | FR-020 |
| PATCH | `/tarefas/{id}` | Edita campos. | FR-020 |
| PATCH | `/tarefas/{id}/status` | Atualiza status (usado pelo drag do Kanban). Aplica RN-02 (retorno de revisão). | FR-023/024 |
| DELETE | `/tarefas/{id}` | Exclui. | FR-020 |

## Calendário
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/calendario/eventos` | Prazos das tarefas no intervalo. | FR-030 |
| GET | `/integracoes/calendario` | Lista integrações (google/icloud) e estado. | FR-031/032 |
| POST | `/integracoes/calendario/{tipo}/sync` | Dispara sincronização. Registra SYNC_LOG. | FR-031..033 |

> OAuth do Google e setup do CalDAV são feitos fora da API REST normal (fluxo de autorização dedicado / configuração no `.env`). Ver `PREREQUISITOS.md`.

## Agentes
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/agentes` | Lista agentes (status, fonte, projeto, controlavel). | FR-040/042/045 |
| GET | `/agentes/{id}` | Detalhe + resumo da sessão. | FR-040 |
| POST | `/agentes` | Inicia novo agente via Agent SDK (prompt, ferramentas permitidas, projeto). Cria JOB. | FR-043 |
| POST | `/agentes/{id}/stop` | Para/cancela agente próprio (403 se `controlavel=false`). | FR-044 |

## Jobs
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/jobs` | Lista jobs (filtro por status/tipo). Inclui em execução agora. | FR-050/052 |
| GET | `/jobs/{id}` | Detalhe + logs. | FR-052 |
| PATCH | `/jobs/{id}` | Pausar/retomar/cancelar/editar params (só jobs controláveis). | FR-051 |

## Skills
| Método | Rota | Descrição | Req |
|---|---|---|---|
| GET | `/skills` | Lista skills (nome, escopo, descrição), lidas do disco/cache. | FR-060 |
| POST | `/skills` | Cria skill nova (gera pasta + SKILL.md global). Valida frontmatter. | FR-061/062 |

## Fase 2 (preparado, não no MVP)
| Método | Rota | Descrição | Req |
|---|---|---|---|
| POST | `/linkedin/rascunhos` | Gera rascunho a partir de itens `publicavel`, aplica sanitização RN-04. | FR-070/072/074 |
| GET | `/linkedin/rascunhos/{id}` | Retorna conteúdo + preview WYSIWYG. | FR-072 |
| POST | `/linkedin/rascunhos/{id}/publicar` | Publica via API oficial (somente se modo auto liberado). | FR-073 |
| GET | `/linkedin/avaliacao` | Últimas sugestões acionáveis. | FR-080 |
| POST | `/prompts/chat` | Chat de melhoria de prompts (API Claude). | FR-090 |
| GET/POST | `/prompts/templates` | Lista/salva versões de system prompts. | FR-091 |
