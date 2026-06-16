import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class McpServer(Base):
    """MCP server cadastrado no workhub. Empacotado no .mcp.json do plugin no export.

    env/headers são listas de {key, value, secret}; quando secret=True o `value`
    é cifrado em repouso (crypto_service) e NUNCA é exportado — vira placeholder ${KEY}.
    """

    __tablename__ = "mcp_server"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    transport: Mapped[str] = mapped_column(String(16), nullable=False, default="stdio")  # stdio | http
    command: Mapped[str | None] = mapped_column(Text, nullable=True)
    args: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["-y", "@org/mcp"]
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    env: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{key, value, secret}]
    headers: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{key, value, secret}]
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PluginMcp(Base):
    """Join: quais MCP servers entram no .mcp.json do plugin."""

    __tablename__ = "plugin_mcp"
    __table_args__ = (UniqueConstraint("plugin_id", "mcp_server_id", name="uq_plugin_mcp"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plugin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plugin.id", ondelete="CASCADE"), nullable=False, index=True
    )
    mcp_server_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mcp_server.id", ondelete="CASCADE"), nullable=False, index=True
    )


class SkillMcp(Base):
    """Join: qual MCP uma skill ensina a usar (vínculo 'MCP-usage')."""

    __tablename__ = "skill_mcp"
    __table_args__ = (UniqueConstraint("skill_remota_id", "mcp_server_id", name="uq_skill_mcp"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_remota_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skill_remota.id", ondelete="CASCADE"), nullable=False, index=True
    )
    mcp_server_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("mcp_server.id", ondelete="CASCADE"), nullable=False, index=True
    )
