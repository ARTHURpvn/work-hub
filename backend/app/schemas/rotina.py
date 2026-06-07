import uuid
from datetime import datetime

from pydantic import BaseModel


class RotinaResponse(BaseModel):
    id: uuid.UUID
    nome: str
    descricao: str | None
    comando: str | None
    agendamento: str | None
    ativa: bool
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class RotinaCreate(BaseModel):
    nome: str
    descricao: str | None = None
    comando: str | None = None
    agendamento: str | None = None
    ativa: bool = True


class RotinaUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    comando: str | None = None
    agendamento: str | None = None
    ativa: bool | None = None
