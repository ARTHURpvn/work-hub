"""ferramenta: site_url + tipo de credencial (valor | email+senha)

Revision ID: 016
Revises: 015
Create Date: 2026-06-25

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec("ALTER TABLE ferramenta ADD COLUMN site_url TEXT")
    _exec("ALTER TABLE ferramenta ADD COLUMN cred_tipo VARCHAR(20) NOT NULL DEFAULT 'valor'")
    _exec("ALTER TABLE ferramenta ADD COLUMN cred_email VARCHAR(255)")


def downgrade() -> None:
    _exec("ALTER TABLE ferramenta DROP COLUMN IF EXISTS site_url")
    _exec("ALTER TABLE ferramenta DROP COLUMN IF EXISTS cred_tipo")
    _exec("ALTER TABLE ferramenta DROP COLUMN IF EXISTS cred_email")
