"""vps, credencial de projeto e links (site/github)

Revision ID: 002
Revises: 001
Create Date: 2026-06-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec("""
        CREATE TABLE vps (
            id        UUID PRIMARY KEY,
            nome      VARCHAR(255),
            ip        VARCHAR(45) NOT NULL,
            provedor  VARCHAR(255),
            criado_em TIMESTAMPTZ NOT NULL
        )
    """)

    _exec("ALTER TABLE projeto ADD COLUMN vps_id UUID REFERENCES vps(id) ON DELETE SET NULL")
    _exec("ALTER TABLE projeto ADD COLUMN github_url VARCHAR(500)")
    _exec("ALTER TABLE projeto ADD COLUMN site_url VARCHAR(500)")
    _exec("CREATE INDEX ix_projeto_vps_id ON projeto(vps_id)")

    _exec("""
        CREATE TABLE credencial_projeto (
            id            UUID PRIMARY KEY,
            projeto_id    UUID NOT NULL REFERENCES projeto(id) ON DELETE CASCADE,
            usuario       VARCHAR(500) NOT NULL,
            senha_cifrada TEXT NOT NULL,
            criado_em     TIMESTAMPTZ NOT NULL,
            atualizado_em TIMESTAMPTZ NOT NULL
        )
    """)
    _exec("CREATE UNIQUE INDEX ix_credencial_projeto_projeto_id ON credencial_projeto(projeto_id)")


def downgrade() -> None:
    _exec("DROP TABLE IF EXISTS credencial_projeto CASCADE")
    _exec("DROP INDEX IF EXISTS ix_projeto_vps_id")
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS site_url")
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS github_url")
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS vps_id")
    _exec("DROP TABLE IF EXISTS vps CASCADE")
