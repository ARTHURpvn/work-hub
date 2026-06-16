import uuid
from datetime import datetime

from pydantic import BaseModel


class SubagentResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    model: str
    tools: str | None
    system_prompt: str
    color: str | None
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class SubagentCreate(BaseModel):
    name: str
    description: str
    model: str = "inherit"
    tools: str | None = None
    system_prompt: str
    color: str | None = None


class SubagentUpdate(BaseModel):
    description: str | None = None
    model: str | None = None
    tools: str | None = None
    system_prompt: str | None = None
    color: str | None = None


class SubagentMelhoria(BaseModel):
    description: str | None = None
    system_prompt: str | None = None
