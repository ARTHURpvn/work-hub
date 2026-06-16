import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Subagent(Base):
    """Subagent do Claude Code — Claude isolado com modelo e ferramentas próprios.

    Espelhado em ~/.claude/agents/<name>.md (frontmatter + system prompt) e incluído
    no bundle do plugin (agents/) no export.
    """

    __tablename__ = "subagent"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(String(64), nullable=False, default="inherit")
    tools: Mapped[str | None] = mapped_column(Text, nullable=True)  # CSV; null = herda todas
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PluginSubagent(Base):
    """Join: quais subagents entram em cada plugin."""

    __tablename__ = "plugin_subagent"
    __table_args__ = (UniqueConstraint("plugin_id", "subagent_id", name="uq_plugin_subagent"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plugin.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subagent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subagent.id", ondelete="CASCADE"), nullable=False, index=True
    )
