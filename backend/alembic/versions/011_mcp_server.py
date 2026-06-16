"""mcp servers (MCP-usage) + vínculos com plugin e skill

Revision ID: 011
Revises: 010
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE mcp_server (
            id            UUID PRIMARY KEY,
            name          VARCHAR(64) NOT NULL UNIQUE,
            transport     VARCHAR(16) NOT NULL DEFAULT 'stdio',
            command       TEXT,
            args          JSONB,
            url           TEXT,
            env           JSONB,
            headers       JSONB,
            descricao     TEXT,
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_mcp_server_name ON mcp_server(name)")
    _exec(
        """
        CREATE TABLE plugin_mcp (
            id            UUID PRIMARY KEY,
            plugin_id     UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
            mcp_server_id UUID NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
            CONSTRAINT uq_plugin_mcp UNIQUE (plugin_id, mcp_server_id)
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_mcp_plugin_id ON plugin_mcp(plugin_id)")
    _exec(
        """
        CREATE TABLE skill_mcp (
            id              UUID PRIMARY KEY,
            skill_remota_id UUID NOT NULL REFERENCES skill_remota(id) ON DELETE CASCADE,
            mcp_server_id   UUID NOT NULL REFERENCES mcp_server(id) ON DELETE CASCADE,
            CONSTRAINT uq_skill_mcp UNIQUE (skill_remota_id, mcp_server_id)
        )
        """
    )
    _exec("CREATE INDEX ix_skill_mcp_skill_remota_id ON skill_mcp(skill_remota_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS skill_mcp CASCADE")
    _exec("DROP TABLE IF EXISTS plugin_mcp CASCADE")
    _exec("DROP TABLE IF EXISTS mcp_server CASCADE")
