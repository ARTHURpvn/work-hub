import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

StatusAgenteEnum = Enum("rodando", "concluido", "falhou", "parado", name="status_agente_enum")
FonteEnum = Enum("sdk", "disco", name="fonte_enum")
TipoJobEnum = Enum(
    "agente", "cron_linkedin", "ingestao", "sync", "avaliacao_linkedin", name="tipo_job_enum"
)
StatusJobEnum = Enum(
    "enfileirado", "rodando", "concluido", "falhou", "cancelado", name="status_job_enum"
)
NivelLogEnum = Enum("info", "warn", "error", name="nivel_log_enum")


class Agente(Base):
    __tablename__ = "agente"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projeto.id", ondelete="SET NULL"), nullable=True
    )
    session_uuid: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    nome: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(StatusAgenteEnum, nullable=False, default="parado")
    fonte: Mapped[str] = mapped_column(FonteEnum, nullable=False)
    controlavel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resumo: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    iniciado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="agente")


class Job(Base):
    __tablename__ = "job"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agente_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agente.id", ondelete="SET NULL"), nullable=True, index=True
    )
    tipo: Mapped[str] = mapped_column(TipoJobEnum, nullable=False)
    status: Mapped[str] = mapped_column(StatusJobEnum, nullable=False, default="enfileirado", index=True)
    params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    agendado_para: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    iniciado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finalizado_em: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    agente: Mapped["Agente | None"] = relationship("Agente", back_populates="jobs")
    logs: Mapped[list["JobLog"]] = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")


class JobLog(Base):
    __tablename__ = "job_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("job.id", ondelete="CASCADE"), nullable=False
    )
    nivel: Mapped[str] = mapped_column(NivelLogEnum, nullable=False, default="info")
    mensagem: Mapped[str] = mapped_column(Text, nullable=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    job: Mapped["Job"] = relationship("Job", back_populates="logs")
