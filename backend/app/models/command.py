import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Command(Base):
    """Slash command do Claude Code — prompt reutilizável (/nome).

    Espelhado em ~/.claude/commands/<name>.md e incluído no bundle do plugin
    (commands/<name>.md). O corpo é o prompt; o nome do arquivo = nome do comando.
    """

    __tablename__ = "command"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    argument_hint: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    allowed_tools: Mapped[str | None] = mapped_column(Text, nullable=True)  # CSV
    conteudo: Mapped[str] = mapped_column(Text, nullable=False)  # corpo = prompt
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PluginCommand(Base):
    """Join: quais commands entram no bundle do plugin (commands/)."""

    __tablename__ = "plugin_command"
    __table_args__ = (UniqueConstraint("plugin_id", "command_id", name="uq_plugin_command"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plugin.id", ondelete="CASCADE"), nullable=False, index=True
    )
    command_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("command.id", ondelete="CASCADE"), nullable=False, index=True
    )
