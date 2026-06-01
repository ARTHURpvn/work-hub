import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

TipoCalendarioEnum = Enum("google", "icloud", name="tipo_calendario_enum")
ResultadoSyncEnum = Enum("ok", "erro", name="resultado_sync_enum")


class IntegracaoCalendario(Base):
    __tablename__ = "integracao_calendario"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo: Mapped[str] = mapped_column(TipoCalendarioEnum, nullable=False)
    credencial_cifrada: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ativa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    sync_logs: Mapped[list["SyncLog"]] = relationship("SyncLog", back_populates="integracao")


class SyncLog(Base):
    __tablename__ = "sync_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tarefa_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tarefa.id", ondelete="CASCADE"), nullable=False, index=True
    )
    integracao_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("integracao_calendario.id", ondelete="CASCADE"), nullable=False
    )
    resultado: Mapped[str] = mapped_column(ResultadoSyncEnum, nullable=False)
    detalhe: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    integracao: Mapped["IntegracaoCalendario"] = relationship("IntegracaoCalendario", back_populates="sync_logs")
