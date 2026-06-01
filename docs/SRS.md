# SRS — Especificação de Requisitos de Software

**Projeto:** Dashboard Pessoal de Trabalho (codinome: `workhub`)
**Versão:** 0.1 (planejamento inicial)
**Plataforma:** Aplicação web responsiva (desktop, notebook, celular)
**Usuários:** 1 (o dono). Multiusuário não está no escopo.

> Convenção: cada requisito tem ID único, prioridade **MoSCoW** (Must / Should / Could / Won't-now) e é **verificável**. `FR` = funcional, `NFR` = não-funcional. Decisões não tomadas ficam em **Questões em aberto**, nunca chutadas como fato.

---

## 1. Escopo

**Fase 1 (núcleo):** Agentes da Claude, Skills, Jobs da Claude, To-do/Tarefas (lista + Kanban com dados compartilhados), Projetos, Calendário, Autenticação.
**Fase 2 (arquitetura preparada, implementação posterior):** Cron de publicação no LinkedIn, Avaliação contínua do LinkedIn, Chat de melhoria de prompts.

---

## 2. Restrições (constraints)

| ID | Restrição |
|---|---|
| C-01 | Provedor de agentes/jobs/skills é **obrigatoriamente a Claude (Anthropic)**. Nenhum outro provedor de agentes. |
| C-02 | Deploy na VPS do usuário. Postgres em container Docker na própria VPS. |
| C-03 | Backend em **Python** (FastAPI), ORM **SQLAlchemy 2.0**, migrations com **Alembic**. |
| C-04 | Frontend com **Vite** + biblioteca de componentes prontos e personalizáveis (**shadcn/ui** sobre React + TypeScript + Tailwind). |
| C-05 | Do SSH de um projeto, **armazenar apenas o IP**. Nenhuma chave privada, usuário, porta ou senha entram no sistema. |
| C-06 | App single-user, mas **com autenticação obrigatória** e endurecimento por IP. |
| C-07 | Integração com Claude via **Claude Agent SDK** (`claude-agent-sdk`, Python) + **leitura do diretório `~/.claude/`** na VPS. |

## 3. Premissas (assumptions)

| ID | Premissa |
|---|---|
| A-01 | O Claude Code está instalado e autenticado na mesma VPS, sob o mesmo usuário do worker do dashboard, com acesso de leitura a `~/.claude/`. |
| A-02 | O usuário possui um plano/credenciais Claude válidos para usar o Agent SDK (ver `PREREQUISITOS.md`). |
| A-03 | Sessões antigas do Claude Code são apagadas automaticamente; o dashboard precisa ingeri-las antes disso. |
| A-04 | A partir de 15/06/2026 o uso de Agent SDK / `claude -p` consome crédito mensal de Agent SDK separado — premissa de custo, não bloqueante. |

---

## 4. Requisitos Funcionais — Fase 1

### Módulo: Autenticação & Segurança
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-001 | O sistema deve exigir login (1 conta) com senha forte; a senha é armazenada com hash Argon2. Não há auto-cadastro. | Must |
| FR-002 | O sistema deve permitir restringir o acesso por allowlist de IP (configurável). | Must |
| FR-003 | O sistema deve oferecer 2FA por TOTP como segunda camada opcional. | Should |
| FR-004 | O sistema deve encerrar sessões inativas por timeout configurável. | Should |

### Módulo: Projetos
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-010 | O usuário deve cadastrar, editar e arquivar projetos. | Must |
| FR-011 | Cada projeto deve registrar a **origem**: `Otávio`, `Titan` ou `Freelas`. | Must |
| FR-012 | Cada projeto deve registrar se **tem autenticação** (sim/não). | Must |
| FR-013 | Cada projeto deve registrar se **tem VPS** (sim/não); se sim, armazenar **apenas o IP do SSH** (string). | Must |
| FR-014 | O usuário deve adicionar membros a um projeto (nome/contato informativos; membros **não** logam no dashboard). | Should |
| FR-015 | O sistema deve relacionar um projeto às suas tarefas (1 projeto → N tarefas). | Must |

### Módulo: Tarefas (To-do + Kanban — dados compartilhados)
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-020 | O usuário deve criar/editar/concluir/excluir tarefas com: título, descrição, prazo, prioridade, projeto (opcional), status. | Must |
| FR-021 | A mesma tarefa deve aparecer em **duas visões da mesma fonte de dados**: lista (com prazos) e Kanban. | Must |
| FR-022 | O Kanban deve ter colunas: **A Fazer**, **Em Andamento**, **Em Revisão**, **Concluído**. | Must |
| FR-023 | O usuário deve **arrastar** cards entre colunas; mover o card **atualiza o status** da mesma tarefa, refletindo na lista. | Must |
| FR-024 | Quando uma tarefa voltar de **Em Revisão** para um status anterior, o sistema deve **marcá-la como "retornou de revisão"** (destaque visual + contador de retornos). | Must |
| FR-025 | A visão lista deve permitir ordenar/filtrar por prazo, projeto e status. | Should |

### Módulo: Calendário
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-030 | O prazo de cada tarefa é a fonte canônica; o sistema deve exibir os prazos num calendário interno. | Must |
| FR-031 | O sistema deve sincronizar prazos com **Google Calendar** (OAuth 2.0). | Should |
| FR-032 | O sistema deve sincronizar prazos com **Apple/iCloud Calendar** via CalDAV (senha de app). | Should |
| FR-033 | O sistema deve registrar o resultado de cada sincronização (sucesso/erro) para diagnóstico. | Should |

### Módulo: Agentes da Claude
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-040 | O sistema deve **listar os agentes/sessões da Claude** lidos de `~/.claude/projects/` e `~/.claude/todos/`, com status (rodando/concluído/falhou/parado) e projeto associado. | Must |
| FR-041 | O sistema deve **ingerir e persistir** sessões/tarefas de agente no Postgres antes da limpeza automática do Claude Code. | Must |
| FR-042 | O usuário deve **organizar** agentes (agrupar por projeto, marcar favoritos, filtrar). | Should |
| FR-043 | O sistema deve **iniciar** novos agentes/jobs via Claude Agent SDK e acompanhar seu status em tempo (quase) real. | Must |
| FR-044 | O sistema deve **parar/cancelar** agentes/jobs que ele mesmo iniciou. | Must |
| FR-045 | Para sessões que o dashboard não iniciou, deve deixar claro que o controle é **somente leitura**. | Must |

### Módulo: Jobs da Claude
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-050 | O sistema deve exibir os jobs em execução no momento (incl. os disparados pelo dashboard e os cron internos). | Must |
| FR-051 | O usuário deve **modificar** jobs que o dashboard controla: pausar, retomar, cancelar e editar parâmetros. | Must |
| FR-052 | O sistema deve manter histórico de execução de jobs (início, fim, status, logs resumidos). | Should |

### Módulo: Skills
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-060 | O sistema deve **listar as skills existentes** lidas de `~/.claude/skills/` (global), `.claude/skills/` (por projeto) e plugins, mostrando nome, escopo e descrição. | Must |
| FR-061 | O usuário deve **criar uma nova skill** (gerar a pasta + `SKILL.md` no diretório de skills global), com nome, descrição e conteúdo. | Must |
| FR-062 | O sistema deve validar o `SKILL.md` (frontmatter `name`/`description`) ao criar. | Should |

---

## 5. Requisitos Funcionais — Fase 2 (preparar arquitetura, implementar depois)

### Módulo: Cron de publicação no LinkedIn
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-070 | Um job agendado deve gerar conteúdo de post de LinkedIn a partir **apenas** de dados marcados como publicáveis no dashboard. | Could |
| FR-071 | O sistema deve usar **system prompts elaborados** para gerar conteúdo de qualidade (não genérico), versionáveis. | Could |
| FR-072 | No modo inicial, o sistema deve gerar um **rascunho com preview fiel (WYSIWYG)** de como o post ficará, sem publicar. | Could |
| FR-073 | Após validação ("IA treinada"), o sistema deve permitir alternar para **publicação automática** via API oficial do LinkedIn. | Could |
| FR-074 | **Regra de sanitização (obrigatória sempre que houver geração):** vide RN-04. | Could |

### Módulo: Avaliação contínua do LinkedIn
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-080 | O sistema deve analisar perfil e/ou publicações em frequência configurável e apontar melhorias **acionáveis**. | Could |
| FR-081 | O sistema deve registrar as fontes acessadas e a frequência da avaliação. | Could |

### Módulo: Chat de melhoria de prompts
| ID | Requisito | MoSCoW |
|---|---|---|
| FR-090 | O usuário deve refinar prompts num chat, testar variações e receber sugestões (via API Claude). | Could |
| FR-091 | O sistema deve permitir salvar versões de prompts para reuso (ex.: nos jobs de LinkedIn). | Could |

---

## 6. Requisitos Não-Funcionais (ISO/IEC 25010)

| ID | Categoria | Requisito | MoSCoW |
|---|---|---|---|
| NFR-001 | Segurança | Segredos reais (chaves SSH, credenciais de projeto) **nunca** são armazenados; só o IP do SSH. Tokens OAuth/CalDAV ficam criptografados em repouso (chave fora do banco). | Must |
| NFR-002 | Segurança | Tráfego sempre via HTTPS/TLS; cookies de sessão `HttpOnly`+`Secure`; proteção CSRF. | Must |
| NFR-003 | Segurança | Acesso restringível por allowlist de IP no reverse proxy; rate limiting no login. | Must |
| NFR-004 | Segurança | Dados sensíveis (IP de SSH, flag de auth, membros) **nunca** chegam ao módulo LinkedIn. Garantido por allowlist + denylist (RN-04). | Must |
| NFR-005 | Usabilidade | Responsivo de 360px (celular) a desktop; Kanban arrastável também em toque. | Must |
| NFR-006 | Desempenho | Telas de lista/Kanban carregam em < 1,5 s com até 1.000 tarefas; status de agentes atualiza em ≤ 5 s. | Should |
| NFR-007 | Confiabilidade | Ingestão de sessões do Claude Code é idempotente e tolera arquivo malformado sem derrubar o worker. | Must |
| NFR-008 | Manutenibilidade | Schema versionado por Alembic; toda mudança de modelo tem migration. | Must |
| NFR-009 | Portabilidade | App, worker e Postgres sobem via `docker compose` numa VPS Linux. | Must |
| NFR-010 | Observabilidade | Logs estruturados; histórico de jobs e syncs consultável. | Should |

---

## 7. Regras de Negócio

| ID | Regra |
|---|---|
| RN-01 | Status válidos de tarefa: `A Fazer`, `Em Andamento`, `Em Revisão`, `Concluído`. Transição livre entre eles. |
| RN-02 | Se o status sair de `Em Revisão` para `A Fazer` ou `Em Andamento`, incrementar `revisao_retornos` e ligar a flag `retornou_de_revisao`. A flag desliga ao atingir `Concluído`. |
| RN-03 | Projeto com `tem_vps = não` não pode ter `ssh_ip` preenchido. |
| RN-04 | **Sanitização de conteúdo do LinkedIn (sempre):** (a) **Denylist absoluta** — `ssh_ip`, `tem_autenticacao`, membros, hosts e qualquer credencial **nunca** entram no conteúdo. (b) Se `origem ∈ {Otávio, Titan}`: ocultar o nome real da empresa, referir como "Projeto X", **sem** link de GitHub nem de site; permitidos apenas prints aprovados pelo usuário e aprendizados. (c) Se `origem = Freelas`: dados reais permitidos, exceto o que comprometa o projeto. (d) Só entram itens com flag `publicavel = true`. |
| RN-05 | Controle de jobs/agentes só é permitido para execuções iniciadas pelo dashboard; as demais são read-only. |

---

## 8. Questões em aberto

| ID | Questão | Impacto |
|---|---|---|
| Q-01 | Colunas do Kanban variam por projeto no futuro? (Hoje: fixas e globais.) | Modelo de dados já permite, UI não. |
| Q-02 | A avaliação do LinkedIn lerá dados via API oficial (limitada) ou o usuário colará/enviará os dados? | Define viabilidade de FR-080. |
| Q-03 | Sincronização de calendário é só de saída (dashboard→calendário) ou bidirecional? (MVP: saída.) | Complexidade do FR-031/032. |
| Q-04 | "IA treinada" para auto-publicar: critério objetivo de liberação (ex.: N rascunhos aprovados)? | Gatilho do FR-073. |
