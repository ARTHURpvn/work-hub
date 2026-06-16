import uuid
from datetime import datetime

from pydantic import BaseModel


class CommandResponse(BaseModel):
    id: uuid.UUID
    name: str
    descricao: str | None
    argument_hint: str | None
    model: str | None
    allowed_tools: str | None
    conteudo: str
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class CommandCreate(BaseModel):
    name: str
    descricao: str | None = None
    argument_hint: str | None = None
    model: str | None = None
    allowed_tools: str | None = None
    conteudo: str


class CommandUpdate(BaseModel):
    descricao: str | None = None
    argument_hint: str | None = None
    model: str | None = None
    allowed_tools: str | None = None
    conteudo: str | None = None
