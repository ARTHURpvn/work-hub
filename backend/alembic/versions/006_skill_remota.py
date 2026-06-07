"""skills custom espelhadas na Anthropic Skill Management API

Revision ID: 006
Revises: 005
Create Date: 2026-06-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE skill_remota (
            id            UUID PRIMARY KEY,
            skill_id      VARCHAR(120) NOT NULL UNIQUE,
            name          VARCHAR(64) NOT NULL,
            display_title VARCHAR(255) NOT NULL,
            descricao     TEXT,
            conteudo      TEXT NOT NULL,
            versao_atual  VARCHAR(64),
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_skill_remota_skill_id ON skill_remota(skill_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS skill_remota CASCADE")
