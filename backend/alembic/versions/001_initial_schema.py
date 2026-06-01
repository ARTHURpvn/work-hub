"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec("CREATE TYPE origem_enum AS ENUM ('Otavio', 'Titan', 'Freelas')")
    _exec("CREATE TYPE status_tarefa_enum AS ENUM ('A Fazer', 'Em Andamento', 'Em Revisao', 'Concluido')")
    _exec("CREATE TYPE prioridade_enum AS ENUM ('baixa', 'media', 'alta')")
    _exec("CREATE TYPE status_agente_enum AS ENUM ('rodando', 'concluido', 'falhou', 'parado')")
    _exec("CREATE TYPE fonte_enum AS ENUM ('sdk', 'disco')")
    _exec("CREATE TYPE tipo_job_enum AS ENUM ('agente', 'cron_linkedin', 'ingestao', 'sync', 'avaliacao_linkedin')")
    _exec("CREATE TYPE status_job_enum AS ENUM ('enfileirado', 'rodando', 'concluido', 'falhou', 'cancelado')")
    _exec("CREATE TYPE nivel_log_enum AS ENUM ('info', 'warn', 'error')")
    _exec("CREATE TYPE escopo_skill_enum AS ENUM ('global', 'projeto', 'plugin')")
    _exec("CREATE TYPE tipo_calendario_enum AS ENUM ('google', 'icloud')")
    _exec("CREATE TYPE resultado_sync_enum AS ENUM ('ok', 'erro')")
    _exec("CREATE TYPE status_post_enum AS ENUM ('rascunho', 'aprovado', 'publicado', 'descartado')")

    _exec("""
        CREATE TABLE usuario (
            id           UUID PRIMARY KEY,
            email        VARCHAR(255) NOT NULL UNIQUE,
            senha_hash   TEXT NOT NULL,
            totp_secret  TEXT,
            ip_allowlist JSONB,
            criado_em    TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("""
        CREATE TABLE projeto (
            id               UUID PRIMARY KEY,
            nome             VARCHAR(255) NOT NULL,
            origem           origem_enum NOT NULL,
            tem_autenticacao BOOLEAN NOT NULL DEFAULT FALSE,
            tem_vps          BOOLEAN NOT NULL DEFAULT FALSE,
            ssh_ip           VARCHAR(45),
            publicavel       BOOLEAN NOT NULL DEFAULT FALSE,
            arquivado        BOOLEAN NOT NULL DEFAULT FALSE,
            criado_em        TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("""
        CREATE TABLE projeto_membro (
            id         UUID PRIMARY KEY,
            projeto_id UUID NOT NULL REFERENCES projeto(id) ON DELETE CASCADE,
            nome       VARCHAR(255) NOT NULL,
            contato    VARCHAR(500)
        )
    """)

    _exec("""
        CREATE TABLE tarefa (
            id                  UUID PRIMARY KEY,
            projeto_id          UUID REFERENCES projeto(id) ON DELETE SET NULL,
            titulo              VARCHAR(500) NOT NULL,
            descricao           TEXT,
            status              status_tarefa_enum NOT NULL DEFAULT 'A Fazer',
            prioridade          prioridade_enum NOT NULL DEFAULT 'media',
            prazo               TIMESTAMPTZ,
            retornou_de_revisao BOOLEAN NOT NULL DEFAULT FALSE,
            revisao_retornos    INTEGER NOT NULL DEFAULT 0,
            publicavel          BOOLEAN NOT NULL DEFAULT FALSE,
            criado_em           TIMESTAMPTZ NOT NULL,
            atualizado_em       TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_tarefa_projeto_id ON tarefa(projeto_id)")

    _exec("""
        CREATE TABLE agente (
            id            UUID PRIMARY KEY,
            projeto_id    UUID REFERENCES projeto(id) ON DELETE SET NULL,
            session_uuid  VARCHAR(255) NOT NULL UNIQUE,
            nome          VARCHAR(500) NOT NULL,
            status        status_agente_enum NOT NULL DEFAULT 'parado',
            fonte         fonte_enum NOT NULL,
            controlavel   BOOLEAN NOT NULL DEFAULT FALSE,
            resumo        JSONB,
            iniciado_em   TIMESTAMPTZ,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_agente_session_uuid ON agente(session_uuid)")

    _exec("""
        CREATE TABLE job (
            id            UUID PRIMARY KEY,
            agente_id     UUID REFERENCES agente(id) ON DELETE SET NULL,
            tipo          tipo_job_enum NOT NULL,
            status        status_job_enum NOT NULL DEFAULT 'enfileirado',
            params        JSONB,
            agendado_para TIMESTAMPTZ,
            iniciado_em   TIMESTAMPTZ,
            finalizado_em TIMESTAMPTZ
        )
    """)
    _exec("CREATE INDEX ix_job_agente_id ON job(agente_id)")
    _exec("CREATE INDEX ix_job_status ON job(status)")

    _exec("""
        CREATE TABLE job_log (
            id        UUID PRIMARY KEY,
            job_id    UUID NOT NULL REFERENCES job(id) ON DELETE CASCADE,
            nivel     nivel_log_enum NOT NULL DEFAULT 'info',
            mensagem  TEXT NOT NULL,
            criado_em TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("""
        CREATE TABLE skill_ref (
            id        UUID PRIMARY KEY,
            nome      VARCHAR(255) NOT NULL,
            escopo    escopo_skill_enum NOT NULL,
            caminho   VARCHAR(1000) NOT NULL,
            descricao TEXT,
            visto_em  TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("""
        CREATE TABLE integracao_calendario (
            id                 UUID PRIMARY KEY,
            tipo               tipo_calendario_enum NOT NULL,
            credencial_cifrada JSONB,
            ativa              BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)

    _exec("""
        CREATE TABLE sync_log (
            id            UUID PRIMARY KEY,
            tarefa_id     UUID NOT NULL REFERENCES tarefa(id) ON DELETE CASCADE,
            integracao_id UUID NOT NULL REFERENCES integracao_calendario(id) ON DELETE CASCADE,
            resultado     resultado_sync_enum NOT NULL,
            detalhe       TEXT,
            criado_em     TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_sync_log_tarefa_id ON sync_log(tarefa_id)")

    _exec("""
        CREATE TABLE prompt_template (
            id        UUID PRIMARY KEY,
            nome      VARCHAR(255) NOT NULL,
            conteudo  TEXT NOT NULL,
            versao    INTEGER NOT NULL DEFAULT 1,
            criado_em TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("""
        CREATE TABLE linkedin_post (
            id                 UUID PRIMARY KEY,
            prompt_template_id UUID REFERENCES prompt_template(id) ON DELETE SET NULL,
            conteudo_gerado    TEXT NOT NULL,
            status             status_post_enum NOT NULL DEFAULT 'rascunho',
            fontes             JSONB,
            criado_em          TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_linkedin_post_status ON linkedin_post(status)")


def downgrade() -> None:
    for table in [
        "linkedin_post", "prompt_template", "sync_log", "integracao_calendario",
        "skill_ref", "job_log", "job", "agente", "tarefa",
        "projeto_membro", "projeto", "usuario",
    ]:
        _exec(f"DROP TABLE IF EXISTS {table} CASCADE")

    for typ in [
        "status_post_enum", "resultado_sync_enum", "tipo_calendario_enum",
        "escopo_skill_enum", "nivel_log_enum", "status_job_enum", "tipo_job_enum",
        "fonte_enum", "status_agente_enum", "prioridade_enum", "status_tarefa_enum",
        "origem_enum",
    ]:
        _exec(f"DROP TYPE IF EXISTS {typ}")
