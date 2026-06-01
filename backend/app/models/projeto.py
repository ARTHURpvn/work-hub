import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

OrigemEnum = Enum("Otavio", "Titan", "Freelas", name="origem_enum")


class Projeto(Base):
    __tablename__ = "projeto"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    origem: Mapped[str] = mapped_column(OrigemEnum, nullable=False)
    tem_autenticacao: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    tem_vps: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ssh_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    vps_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vps.id", ondelete="SET NULL"), nullable=True, index=True
    )
    github_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    site_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    publicavel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    arquivado: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    membros: Mapped[list["ProjetoMembro"]] = relationship(
        "ProjetoMembro", back_populates="projeto", cascade="all, delete-orphan"
    )
    vps: Mapped["Vps | None"] = relationship("Vps", back_populates="projetos")  # noqa: F821
    credencial: Mapped["CredencialProjeto | None"] = relationship(  # noqa: F821
        "CredencialProjeto", back_populates="projeto", cascade="all, delete-orphan", uselist=False
    )

    @property
    def tem_credencial(self) -> bool:
        """True se há credencial salva. Requer a relação `credencial` carregada."""
        return self.credencial is not None


class ProjetoMembro(Base):
    __tablename__ = "projeto_membro"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projeto_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projeto.id", ondelete="CASCADE"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    contato: Mapped[str | None] = mapped_column(String(500), nullable=True)

    projeto: Mapped["Projeto"] = relationship("Projeto", back_populates="membros")
