"""plugins do Claude Code (empacotamento de skills)

Revision ID: 009
Revises: 008
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE plugin (
            id            UUID PRIMARY KEY,
            name          VARCHAR(64) NOT NULL UNIQUE,
            display_title VARCHAR(255) NOT NULL,
            descricao     TEXT,
            version       VARCHAR(32) NOT NULL DEFAULT '0.1.0',
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_name ON plugin(name)")
    _exec(
        """
        CREATE TABLE plugin_skill (
            id              UUID PRIMARY KEY,
            plugin_id       UUID NOT NULL REFERENCES plugin(id) ON DELETE CASCADE,
            skill_remota_id UUID NOT NULL REFERENCES skill_remota(id) ON DELETE CASCADE,
            CONSTRAINT uq_plugin_skill UNIQUE (plugin_id, skill_remota_id)
        )
        """
    )
    _exec("CREATE INDEX ix_plugin_skill_plugin_id ON plugin_skill(plugin_id)")
    _exec("CREATE INDEX ix_plugin_skill_skill_remota_id ON plugin_skill(skill_remota_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS plugin_skill CASCADE")
    _exec("DROP TABLE IF EXISTS plugin CASCADE")
