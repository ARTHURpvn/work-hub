from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Configuracao(Base):
    """Par chave/valor para configurações do app (ex.: chaves de API).

    O `valor_cifrado` é um token Fernet (segredo cifrado em repouso). Valores
    não-secretos (ex.: nome do modelo) também são guardados cifrados por
    uniformidade — a distinção secreto/não-secreto é feita na camada de serviço.
    """

    __tablename__ = "configuracao"

    chave: Mapped[str] = mapped_column(String(100), primary_key=True)
    valor_cifrado: Mapped[str] = mapped_column(Text, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
