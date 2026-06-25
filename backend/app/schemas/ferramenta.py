import uuid
from datetime import datetime

from pydantic import BaseModel


class FerramentaCreate(BaseModel):
    nome: str
    times: list[str] = []
    descricao: str | None = None
    onde_obter: str | None = None
    credencial: str | None = None  # valor em claro; é cifrado antes de salvar


class FerramentaUpdate(BaseModel):
    nome: str | None = None
    times: list[str] | None = None
    descricao: str | None = None
    onde_obter: str | None = None
    # credencial: string nova cifra; "" limpa; None mantém a atual
    credencial: str | None = None


class FerramentaResponse(BaseModel):
    id: uuid.UUID
    nome: str
    times: list[str] = []
    descricao: str | None = None
    onde_obter: str | None = None
    tem_credencial: bool = False
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class CredencialRevelada(BaseModel):
    credencial: str
