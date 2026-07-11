"""ideia: brief no projeto + tabela ideia_chat (co-escrita com IA)

Revision ID: 019
Revises: 018
Create Date: 2026-07-08

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec("ALTER TABLE projeto ADD COLUMN brief TEXT")
    _exec(
        """
        CREATE TABLE ideia_chat (
            id         UUID PRIMARY KEY,
            projeto_id UUID NOT NULL REFERENCES projeto(id) ON DELETE CASCADE,
            role       VARCHAR(20) NOT NULL,
            content    TEXT NOT NULL,
            criado_em  TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_ideia_chat_projeto_id ON ideia_chat(projeto_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS ideia_chat CASCADE")
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS brief")
