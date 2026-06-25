"""ferramentas por time (com credencial cifrada / onde obter)

Revision ID: 015
Revises: 014
Create Date: 2026-06-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE ferramenta (
            id                 UUID PRIMARY KEY,
            nome               VARCHAR(120) NOT NULL,
            times              JSONB NOT NULL DEFAULT '[]',
            descricao          TEXT,
            onde_obter         TEXT,
            credencial_cifrada TEXT,
            criado_em          TIMESTAMPTZ NOT NULL DEFAULT now(),
            atualizado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    _exec("CREATE INDEX ix_ferramenta_nome ON ferramenta(nome)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS ferramenta")
