# PRÉ-REQUISITOS — O que VOCÊ precisa providenciar

Checklist por etapa. Marque item a item. Tudo que só você pode fazer (criar conta, autorizar OAuth, gerar token, configurar SSH/infra) está aqui. O resto a IA construtora faz a partir da `docs/`.

---

## Etapa 0 — Infra / ambiente (necessário para o MVP)
- [ ] **VPS Linux** acessível, com **Docker** e **Docker Compose** instalados.
- [ ] **Domínio** apontando para a VPS (para TLS) — ou IP fixo, se preferir só por IP.
- [ ] **PostgreSQL** vai rodar em container (você não precisa instalar à parte; só reservar volume e backup).
- [ ] Definir a **allowlist de IP** de onde você vai acessar o dashboard (seu IP fixo / VPN).
- [ ] **Backup** do volume do Postgres (cron de dump) — recomendado antes de usar pra valer.

## Etapa 1 — Claude (núcleo: Agentes / Jobs / Skills)
- [ ] **Conta Claude** válida e com a **CLI do Claude Code autenticada na VPS**, sob o mesmo usuário que roda o worker.
  - Instalar: `curl -fsSL https://claude.ai/install.sh | bash` (ou usar a CLI embutida no SDK).
- [ ] **Plano/billing da Claude** que cubra o uso do **Agent SDK** (`pip install claude-agent-sdk`, Python 3.10+).
  - ⚠️ A partir de **15/06/2026**, uso de Agent SDK / `claude -p` em planos de assinatura consome um **crédito mensal de Agent SDK separado** do uso interativo. Confirme seu plano/limite em: https://platform.claude.com/docs/en/agent-sdk e https://docs.claude.com/en/api/overview
- [ ] Garantir que o worker tenha **leitura** em `~/.claude/` (`projects/`, `todos/`, `skills/`, `history.jsonl`) — montar esse diretório no container do worker.
- [ ] Decidir o **diretório global de skills** onde novas skills serão criadas (padrão `~/.claude/skills/`).
- [ ] (Se for usar provedor alternativo de billing) variáveis tipo `CLAUDE_CODE_USE_BEDROCK`/`_VERTEX` — opcional.

## Etapa 2 — Calendário (FEAT-07)
**Google Calendar**
- [ ] Criar projeto no **Google Cloud Console** e ativar a **Google Calendar API**.
- [ ] Configurar **tela de consentimento OAuth** e criar **OAuth Client ID** (tipo Web).
- [ ] Anotar **Client ID** e **Client Secret**; cadastrar a **redirect URI** do dashboard.
- [ ] Autorizar o app (fluxo OAuth) — passo manual seu, no primeiro uso.

**Apple / iCloud Calendar (CalDAV)**
- [ ] Em https://appleid.apple.com → **Login e Segurança → Senhas específicas de app**, gerar uma **senha de app** para o dashboard.
- [ ] Anotar seu **Apple ID** e essa senha de app (entra cifrada; ver NFR-001).

## Etapa 3 — LinkedIn (Fase 2 — só quando chegar lá)
- [ ] Criar **app no LinkedIn Developer Portal** (https://www.linkedin.com/developers/) vinculado a uma Página, se exigido.
- [ ] Solicitar os **produtos/escopos** necessários (ex.: "Sign In with LinkedIn (OpenID Connect)" e o de compartilhamento `w_member_social`) — **passa por revisão/aprovação da LinkedIn**.
- [ ] Anotar **Client ID / Client Secret** e configurar **redirect URI**.
- [ ] Autorizar via OAuth (passo manual seu).
- [ ] Definir o **critério de "IA treinada"** para liberar auto-publish (Q-04) — ex.: N rascunhos aprovados.
- [ ] Marcar nos projetos/tarefas o que é **`publicavel`** (a allowlist só usa o que você liberar).

> Enquanto a aprovação do LinkedIn não sai, o modo **rascunho** funciona sem ela.

## Etapa 4 — Segredos & variáveis de ambiente (`.env` na VPS)
Preencher (nunca commitar este arquivo):
- [ ] `DATABASE_URL` (Postgres do compose)
- [ ] `APP_SECRET_KEY` (sessões/CSRF)
- [ ] `ENCRYPTION_KEY` (cifra tokens de calendário / TOTP em repouso — **fora do banco**)
- [ ] `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (sua conta única; gerar o hash Argon2)
- [ ] `IP_ALLOWLIST` (IPs permitidos)
- [ ] `CLAUDE_HOME=/home/<user>/.claude` (caminho montado no worker)
- [ ] `ANTHROPIC_API_KEY` **ou** sessão da CLI autenticada (conforme o modo do SDK)
- [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- [ ] `ICLOUD_APPLE_ID`, `ICLOUD_APP_PASSWORD`
- [ ] (F2) `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`

## Etapa 5 — Confirmações de decisão (eu preciso de você)
- [ ] Q-01: Kanban com colunas fixas globais por enquanto? (sim/não)
- [ ] Q-02: Avaliação do LinkedIn lê via API oficial (limitada) ou você cola/envia os dados?
- [ ] Q-03: Sync de calendário só de saída no MVP? (sim/não)
- [ ] Q-04: Critério objetivo para liberar auto-publish no LinkedIn.

## Passos que SÓ você pode fazer (resumo)
Criar contas (Google Cloud, LinkedIn Developer, Apple ID) · autorizar todos os fluxos **OAuth** · gerar **senha de app** do iCloud · autenticar a **CLI da Claude** na VPS · configurar **SSH/infra** da VPS e o **DNS** · preencher o **`.env`** · definir a **allowlist de IP**.

> ⚠️ Lembrete de segurança: o dashboard **nunca** guarda chave privada SSH, senha ou credencial de projeto — apenas o **IP**. Mantenha seus segredos reais num cofre fora do app.
