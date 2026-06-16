import uuid
from datetime import datetime

from pydantic import BaseModel


class HookResponse(BaseModel):
    id: uuid.UUID
    descricao: str | None
    event: str
    matcher: str | None
    command: str
    timeout: int | None
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class HookCreate(BaseModel):
    descricao: str | None = None
    event: str
    matcher: str | None = None
    command: str
    timeout: int | None = None


class HookUpdate(BaseModel):
    descricao: str | None = None
    event: str | None = None
    matcher: str | None = None
    command: str | None = None
    timeout: int | None = None
