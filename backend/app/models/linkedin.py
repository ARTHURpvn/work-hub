import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

StatusPostEnum = Enum("rascunho", "aprovado", "publicado", "descartado", name="status_post_enum")


class PromptTemplate(Base):
    __tablename__ = "prompt_template"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)
    versao: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    posts: Mapped[list["LinkedinPost"]] = relationship("LinkedinPost", back_populates="prompt_template")


class LinkedinPost(Base):
    __tablename__ = "linkedin_post"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("prompt_template.id", ondelete="SET NULL"), nullable=True
    )
    conteudo_gerado: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(StatusPostEnum, nullable=False, default="rascunho", index=True)
    fontes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    prompt_template: Mapped["PromptTemplate | None"] = relationship(
        "PromptTemplate", back_populates="posts"
    )
