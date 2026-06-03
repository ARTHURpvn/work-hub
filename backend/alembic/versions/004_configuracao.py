"""tabela de configuração (chaves de API cifradas)

Revision ID: 004
Revises: 003
Create Date: 2026-06-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE configuracao (
            chave         VARCHAR(100) PRIMARY KEY,
            valor_cifrado TEXT NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS configuracao CASCADE")
