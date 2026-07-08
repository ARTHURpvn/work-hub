"""projeto: rascunho/ideia (opcional)

Revision ID: 018
Revises: 017
Create Date: 2026-07-08

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    # DEFAULT false: todos os projetos existentes viram "ativos" (não-ideia)
    _exec("ALTER TABLE projeto ADD COLUMN rascunho BOOLEAN NOT NULL DEFAULT false")


def downgrade() -> None:
    _exec("ALTER TABLE projeto DROP COLUMN IF EXISTS rascunho")
