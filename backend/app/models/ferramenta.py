import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Ferramenta(Base):
    """Ferramenta usada pelos times, com onde obter a credencial (ou ela cifrada)."""

    __tablename__ = "ferramenta"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    times: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    site_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    onde_obter: Mapped[str | None] = mapped_column(Text, nullable=True)
    cred_tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="valor")
    cred_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    credencial_cifrada: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
