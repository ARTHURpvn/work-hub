"""subtarefas, links de tarefa, descrição do projeto e origem Pessoal

Revision ID: 003
Revises: 002
Create Date: 2026-06-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    # Nova origem de projeto (projetos pessoais). PG 12+ permite ADD VALUE em transação.
    _exec("ALTER TYPE origem_enum ADD VALUE IF NOT EXISTS 'Pessoal'")

    # Descrição do projeto
    _exec("ALTER TABLE projeto ADD COLUMN descricao TEXT")

    # Subtarefas (checklist de uma tarefa)
    _exec("""
        CREATE TABLE subtarefa (
            id        UUID PRIMARY KEY,
            tarefa_id UUID NOT NULL REFERENCES tarefa(id) ON DELETE CASCADE,
            titulo    VARCHAR(500) NOT NULL,
            concluida BOOLEAN NOT NULL DEFAULT FALSE,
            ordem     INTEGER NOT NULL DEFAULT 0,
            criado_em TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_subtarefa_tarefa_id ON subtarefa(tarefa_id)")

    # Links úteis de uma tarefa
    _exec("""
        CREATE TABLE tarefa_link (
            id        UUID PRIMARY KEY,
            tarefa_id UUID NOT NULL REFERENCES tarefa(id) ON DELETE CASCADE,
            label     VARCHAR(255) NOT NULL,
            url       VARCHAR(1000) NOT NULL,
            criado_em TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE INDEX ix_tarefa_link_tarefa_id ON tarefa_link(tarefa_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS tarefa_link CASCADE")
    _exec("DROP TABLE IF EXISTS subtarefa CASCADE")
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS descricao")
    # Observação: PostgreSQL não permite remover um valor de ENUM; 'Pessoal' permanece.
