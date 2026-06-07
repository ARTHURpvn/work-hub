"""rotinas do Claude Code e uso de IA

Revision ID: 005
Revises: 004
Create Date: 2026-06-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE rotina (
            id            UUID PRIMARY KEY,
            nome          VARCHAR(255) NOT NULL,
            descricao     TEXT,
            comando       TEXT,
            agendamento   VARCHAR(255),
            ativa         BOOLEAN NOT NULL DEFAULT TRUE,
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec(
        """
        CREATE TABLE uso_ia (
            id            UUID PRIMARY KEY,
            operacao      VARCHAR(50) NOT NULL,
            model         VARCHAR(100) NOT NULL,
            input_tokens  INTEGER NOT NULL DEFAULT 0,
            output_tokens INTEGER NOT NULL DEFAULT 0,
            criado_em     TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_uso_ia_criado_em ON uso_ia(criado_em)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS uso_ia CASCADE")
    _exec("DROP TABLE IF EXISTS rotina CASCADE")
