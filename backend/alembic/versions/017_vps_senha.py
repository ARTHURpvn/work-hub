"""vps: senha opcional (cifrada)

Revision ID: 017
Revises: 016
Create Date: 2026-06-30

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec("ALTER TABLE vps ADD COLUMN senha_cifrada TEXT")


def downgrade() -> None:
    _exec("ALTER TABLE vps DROP COLUMN IF EXISTS senha_cifrada")
