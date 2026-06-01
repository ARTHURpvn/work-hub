import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CredencialProjeto(Base):
    """Credencial de login do site de um projeto. Senha cifrada em repouso (Fernet).

    Relação 1:1 com Projeto (unique em projeto_id).
    """

    __tablename__ = "credencial_projeto"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projeto.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    usuario: Mapped[str] = mapped_column(String(500), nullable=False)
    senha_cifrada: Mapped[str] = mapped_column(Text, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    projeto: Mapped["Projeto"] = relationship("Projeto", back_populates="credencial")  # noqa: F821
