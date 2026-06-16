"""arquivos auxiliares de skills (multi-arquivo / progressive disclosure)

Revision ID: 008
Revises: 007
Create Date: 2026-06-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _exec(sql: str) -> None:
    op.execute(sa.text(sql))


def upgrade() -> None:
    _exec(
        """
        CREATE TABLE skill_arquivo (
            id              UUID PRIMARY KEY,
            skill_remota_id UUID NOT NULL REFERENCES skill_remota(id) ON DELETE CASCADE,
            caminho         VARCHAR(255) NOT NULL,
            conteudo        TEXT NOT NULL,
            criado_em       TIMESTAMPTZ NOT NULL,
            atualizado_em   TIMESTAMPTZ NOT NULL,
            CONSTRAINT uq_skill_arquivo_caminho UNIQUE (skill_remota_id, caminho)
        )
        """
    )
    _exec("CREATE INDEX ix_skill_arquivo_skill_remota_id ON skill_arquivo(skill_remota_id)")
    # arquivos sugeridos pela IA no chat de melhoria (multi-arquivo)
    _exec("ALTER TABLE skill_chat ADD COLUMN IF NOT EXISTS sugestao_arquivos JSONB")


def downgrade() -> None:
    _exec("ALTER TABLE skill_chat DROP COLUMN IF EXISTS sugestao_arquivos")
    _exec("DROP TABLE IF EXISTS skill_arquivo CASCADE")
