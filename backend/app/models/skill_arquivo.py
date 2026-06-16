import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SkillArquivo(Base):
    """Arquivo auxiliar de uma skill multi-arquivo (reference/, scripts/, templates/…).

    O `SKILL.md` principal continua em `skill_remota.conteudo`. Esta tabela guarda os
    arquivos extras do bundle (progressive disclosure), identificados pelo caminho
    relativo dentro da pasta da skill (ex.: 'reference/srs.md', 'scripts/gerar.py').
    """

    __tablename__ = "skill_arquivo"
    __table_args__ = (UniqueConstraint("skill_remota_id", "caminho", name="uq_skill_arquivo_caminho"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_remota_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skill_remota.id", ondelete="CASCADE"), nullable=False, index=True
    )
    caminho: Mapped[str] = mapped_column(String(255), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
