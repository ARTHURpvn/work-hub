"""subagents do Claude Code

Revision ID: 010
Revises: 009
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE subagent (
            id            UUID PRIMARY KEY,
            name          VARCHAR(64) NOT NULL UNIQUE,
            description   TEXT NOT NULL,
            model         VARCHAR(64) NOT NULL DEFAULT 'inherit',
            tools         TEXT,
            system_prompt TEXT NOT NULL,
            color         VARCHAR(20),
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_subagent_name ON subagent(name)")
    _exec(
        """
        CREATE TABLE plugin_subagent (
            id          UUID PRIMARY KEY,
            plugin_id   UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
            subagent_id UUID NOT NULL REFERENCES subagent(id) ON DELETE CASCADE,
            CONSTRAINT uq_plugin_subagent UNIQUE (plugin_id, subagent_id)
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_subagent_plugin_id ON plugin_subagent(plugin_id)")
    _exec("CREATE INDEX ix_plugin_subagent_subagent_id ON plugin_subagent(subagent_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS plugin_subagent CASCADE")
    _exec("DROP TABLE IF EXISTS subagent CASCADE")
