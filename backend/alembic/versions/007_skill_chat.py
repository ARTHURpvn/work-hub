"""histórico do chat de melhoria de skills

Revision ID: 007
Revises: 006
Create Date: 2026-06-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE skill_chat (
            id                UUID PRIMARY KEY,
            skill_remota_id   UUID NOT NULL REFERENCES skill_remota(id) ON DELETE CASCADE,
            role              VARCHAR(20) NOT NULL,
            content           TEXT NOT NULL,
            sugestao_conteudo TEXT,
            demonstracao      TEXT,
            criado_em         TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_skill_chat_skill_remota_id ON skill_chat(skill_remota_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS skill_chat CASCADE")
