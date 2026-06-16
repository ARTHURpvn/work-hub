"""slash commands do Claude Code

Revision ID: 013
Revises: 012
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE command (
            id            UUID PRIMARY KEY,
            name          VARCHAR(64) NOT NULL UNIQUE,
            descricao     TEXT,
            argument_hint VARCHAR(255),
            model         VARCHAR(64),
            allowed_tools TEXT,
            conteudo      TEXT NOT NULL,
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_command_name ON command(name)")
    _exec(
        """
        CREATE TABLE plugin_command (
            id         UUID PRIMARY KEY,
            plugin_id  UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
            command_id UUID NOT NULL REFERENCES command(id) ON DELETE CASCADE,
            CONSTRAINT uq_plugin_command UNIQUE (plugin_id, command_id)
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_command_plugin_id ON plugin_command(plugin_id)")
    _exec("CREATE INDEX ix_plugin_command_command_id ON plugin_command(command_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS plugin_command CASCADE")
    _exec("DROP TABLE IF EXISTS command CASCADE")
