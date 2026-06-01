import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

EscopoEnum = Enum("global", "projeto", "plugin", name="escopo_skill_enum")


class SkillRef(Base):
    __tablename__ = "skill_ref"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    escopo: Mapped[str] = mapped_column(EscopoEnum, nullable=False)
    caminho: Mapped[str] = mapped_column(String(1000), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    visto_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
