"""hooks do Claude Code

Revision ID: 012
Revises: 011
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE hook (
            id            UUID PRIMARY KEY,
            descricao     TEXT,
            event         VARCHAR(40) NOT NULL,
            matcher       VARCHAR(255),
            command       TEXT NOT NULL,
            timeout       INTEGER,
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec(
        """
        CREATE TABLE plugin_hook (
            id        UUID PRIMARY KEY,
            plugin_id UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
            hook_id   UUID NOT NULL REFERENCES hook(id) ON DELETE CASCADE,
            CONSTRAINT uq_plugin_hook UNIQUE (plugin_id, hook_id)
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_hook_plugin_id ON plugin_hook(plugin_id)")
    _exec("CREATE INDEX ix_plugin_hook_hook_id ON plugin_hook(hook_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS plugin_hook CASCADE")
    _exec("DROP TABLE IF EXISTS hook CASCADE")
