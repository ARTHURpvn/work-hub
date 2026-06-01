import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

StatusEnum = Enum("A Fazer", "Em Andamento", "Em Revisao", "Concluido", name="status_tarefa_enum")
PrioridadeEnum = Enum("baixa", "media", "alta", name="prioridade_enum")


class Tarefa(Base):
    __tablename__ = "tarefa"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projeto.id", ondelete="SET NULL"), nullable=True, index=True
    )
    titulo: Mapped[str] = mapped_column(String(500), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(StatusEnum, nullable=False, default="A Fazer")
    prioridade: Mapped[str] = mapped_column(PrioridadeEnum, nullable=False, default="media")
    prazo: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retornou_de_revisao: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    revisao_retornos: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    publicavel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
