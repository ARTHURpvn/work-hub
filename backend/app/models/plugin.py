import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Plugin(Base):
    """Plugin do Claude Code — unidade versionada que empacota skills (e, no futuro,
    subagents/hooks/MCP). O conteúdo das skills vem de skill_remota/skill_arquivo;
    aqui ficam só os metadados do plugin e a seleção de skills (plugin_skill)."""

    __tablename__ = "plugin"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    display_title: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(32), nullable=False, default="0.1.0")
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PluginSkill(Base):
    """Join: quais skills entram em cada plugin."""

    __tablename__ = "plugin_skill"
    __table_args__ = (UniqueConstraint("plugin_id", "skill_remota_id", name="uq_plugin_skill"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plugin.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_remota_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skill_remota.id", ondelete="CASCADE"), nullable=False, index=True
    )
