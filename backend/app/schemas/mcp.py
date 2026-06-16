import uuid
from datetime import datetime

from pydantic import BaseModel


class ParConfig(BaseModel):
    key: str
    value: str = ""
    secret: bool = False


class McpResponse(BaseModel):
    id: uuid.UUID
    name: str
    transport: str
    command: str | None
    args: list[str] | None
    url: str | None
    env: list[ParConfig] = []
    headers: list[ParConfig] = []
    descricao: str | None
    atualizado_em: datetime
    skill_ids: list[uuid.UUID] = []

    model_config = {"from_attributes": True}


class McpCreate(BaseModel):
    name: str
    transport: str = "stdio"
    command: str | None = None
    args: list[str] | None = None
    url: str | None = None
    env: list[ParConfig] = []
    headers: list[ParConfig] = []
    descricao: str | None = None
    skill_ids: list[uuid.UUID] = []


class McpUpdate(BaseModel):
    transport: str | None = None
    command: str | None = None
    args: list[str] | None = None
    url: str | None = None
    env: list[ParConfig] | None = None
    headers: list[ParConfig] | None = None
    descricao: str | None = None
    skill_ids: list[uuid.UUID] | None = None
