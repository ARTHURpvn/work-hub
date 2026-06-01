# DATA_MODEL — Modelo de dados

```mermaid
erDiagram
    USUARIO ||--o{ PROJETO : possui
    PROJETO ||--o{ TAREFA : tem
    PROJETO ||--o{ PROJETO_MEMBRO : "lista (informativa)"
    PROJETO ||--o{ AGENTE : "associa"
    TAREFA }o--o| AGENTE : "pode originar"
    AGENTE ||--o{ JOB : "executa via"
    JOB ||--o{ JOB_LOG : registra
    INTEGRACAO_CALENDARIO ||--o{ SYNC_LOG : gera
    TAREFA ||--o{ SYNC_LOG : "espelha em"
    PROMPT_TEMPLATE ||--o{ LINKEDIN_POST : alimenta

    USUARIO {
      uuid id PK
      string email
      string senha_hash "Argon2"
      string totp_secret "nullable, cifrado"
      jsonb ip_allowlist
      timestamptz criado_em
    }
    PROJETO {
      uuid id PK
      string nome
      enum origem "Otavio|Titan|Freelas"
      bool tem_autenticacao
      bool tem_vps
      string ssh_ip "nullable, SÓ o IP"
      bool publicavel "default false"
      bool arquivado
      timestamptz criado_em
    }
    PROJETO_MEMBRO {
      uuid id PK
      uuid projeto_id FK
      string nome
      string contato "informativo; não loga"
    }
    TAREFA {
      uuid id PK
      uuid projeto_id FK "nullable"
      string titulo
      text descricao
      enum status "A Fazer|Em Andamento|Em Revisao|Concluido"
      enum prioridade "baixa|media|alta"
      timestamptz prazo "nullable"
      bool retornou_de_revisao "default false"
      int revisao_retornos "default 0"
      bool publicavel "default false"
      timestamptz criado_em
      timestamptz atualizado_em
    }
    AGENTE {
      uuid id PK
      uuid projeto_id FK "nullable"
      string session_uuid "chave de ingestão, unique"
      string nome
      enum status "rodando|concluido|falhou|parado"
      enum fonte "sdk|disco"
      bool controlavel "true só se iniciado pelo dashboard"
      jsonb resumo "tarefas/tokens/modelo"
      timestamptz iniciado_em
      timestamptz atualizado_em
    }
    JOB {
      uuid id PK
      uuid agente_id FK "nullable"
      enum tipo "agente|cron_linkedin|ingestao|sync|avaliacao_linkedin"
      enum status "enfileirado|rodando|concluido|falhou|cancelado"
      jsonb params
      timestamptz agendado_para "nullable"
      timestamptz iniciado_em
      timestamptz finalizado_em
    }
    JOB_LOG {
      uuid id PK
      uuid job_id FK
      enum nivel "info|warn|error"
      text mensagem
      timestamptz criado_em
    }
    SKILL_REF {
      uuid id PK
      string nome
      enum escopo "global|projeto|plugin"
      string caminho
      text descricao
      timestamptz visto_em
    }
    INTEGRACAO_CALENDARIO {
      uuid id PK
      enum tipo "google|icloud"
      jsonb credencial_cifrada "token/senha de app, cifrado"
      bool ativa
    }
    SYNC_LOG {
      uuid id PK
      uuid tarefa_id FK
      uuid integracao_id FK
      enum resultado "ok|erro"
      text detalhe
      timestamptz criado_em
    }
    PROMPT_TEMPLATE {
      uuid id PK
      string nome
      text conteudo "system prompt versionado"
      int versao
      timestamptz criado_em
    }
    LINKEDIN_POST {
      uuid id PK
      uuid prompt_template_id FK "nullable"
      text conteudo_gerado
      enum status "rascunho|aprovado|publicado|descartado"
      jsonb fontes "ids dos itens publicaveis usados"
      timestamptz criado_em
    }
```

## Notas do dicionário
- **`PROJETO.ssh_ip`**: armazena exclusivamente o IP (string validada). Constraint: se `tem_vps = false`, `ssh_ip` deve ser `NULL` (RN-03). Nunca há coluna para chave/usuário/porta/senha.
- **`AGENTE.session_uuid`**: chave natural da ingestão; upsert idempotente (NFR-007). `controlavel = true` apenas quando `fonte = sdk` e o job foi iniciado pelo dashboard (RN-05).
- **`USUARIO.totp_secret` e `INTEGRACAO_CALENDARIO.credencial_cifrada`**: cifrados em repouso; a chave de cifragem vem de variável de ambiente / cofre, **fora** do banco (NFR-001).
- **`*.publicavel`**: porta da allowlist de LinkedIn (RN-04). Sem essa flag, o item nunca entra em conteúdo público.
- **`SKILL_REF`**: cache/inventário das skills lidas do disco; a fonte de verdade continua sendo o filesystem `~/.claude/skills`.
- Chaves: UUID v4. Timestamps `timestamptz`. Enums via tipo nativo do Postgres ou `CHECK`.
