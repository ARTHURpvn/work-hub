import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Hook(Base):
    """Hook do Claude Code — automação determinística em eventos do ciclo de vida.

    Empacotado no hooks/hooks.json do plugin no export. O `command` é shell e NUNCA
    é executado pelo workhub — só gravado no bundle.
    """

    __tablename__ = "hook"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)  # rótulo p/ a lista
    event: Mapped[str] = mapped_column(String(40), nullable=False)  # PostToolUse, etc.
    matcher: Mapped[str | None] = mapped_column(String(255), nullable=True)  # null → "*"
    command: Mapped[str] = mapped_column(Text, nullable=False)
    timeout: Mapped[int | None] = mapped_column(Integer, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PluginHook(Base):
    """Join: quais hooks entram no hooks/hooks.json do plugin."""

    __tablename__ = "plugin_hook"
    __table_args__ = (UniqueConstraint("plugin_id", "hook_id", name="uq_plugin_hook"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plugin.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hook_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("hook.id", ondelete="CASCADE"), nullable=False, index=True
    )
