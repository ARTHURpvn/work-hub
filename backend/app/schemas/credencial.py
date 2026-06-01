import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator

# Máscara fixa exibida no lugar da senha — não revela o tamanho real.
SENHA_MASCARA = "••••••••"


class CredencialUpsert(BaseModel):
    """Criação/atualização da credencial de login do site (1 por projeto)."""

    usuario: str
    senha: str

    @field_validator("usuario", "senha")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("usuario e senha não podem ser vazios")
        return v


class CredencialResponse(BaseModel):
    """Resposta padrão — NUNCA inclui a senha em texto."""

    projeto_id: uuid.UUID
    usuario: str
    senha_mascara: str = SENHA_MASCARA
    atualizado_em: datetime


class CredencialReveal(BaseModel):
    """Resposta exclusiva do endpoint de revelar — senha em texto claro."""

    usuario: str
    senha: str
