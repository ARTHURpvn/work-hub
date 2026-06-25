"""dono dinâmico (origem deixa de ser enum)

Revision ID: 014
Revises: 013
Create Date: 2026-06-25

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEED = ["Otavio", "Titan", "Freelas", "Pessoal", "Evolution"]


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE dono (
            id        UUID PRIMARY KEY,
            nome      VARCHAR(64) NOT NULL UNIQUE,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    # origem deixa de ser enum fixo -> texto livre (preserva os valores existentes)
    _exec("ALTER TABLE projeto ALTER COLUMN origem TYPE VARCHAR(64) USING origem::text")
    _exec("DROP TYPE IF EXISTS origem_enum")

    # seed: donos conhecidos + os já usados por projetos existentes
    bind = op.get_bind()
    usados = {r[0] for r in bind.execute(sa.text("SELECT DISTINCT origem FROM projeto")).fetchall() if r[0]}
    for nome in sorted(set(SEED) | usados):
        bind.execute(
            sa.text("INSERT INTO dono (id, nome, criado_em) VALUES (:id, :nome, now()) ON CONFLICT (nome) DO NOTHING"),
            {"id": str(uuid.uuid4()), "nome": nome},
        )


def downgrade() -> None:
    # best-effort: remove a tabela; origem permanece VARCHAR (não recria o enum
    # para não falhar caso existam valores fora do conjunto original).
    _exec("DROP TABLE IF EXISTS dono")
