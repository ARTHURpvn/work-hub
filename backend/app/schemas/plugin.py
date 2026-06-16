import uuid
from datetime import datetime

from pydantic import BaseModel


class PluginResponse(BaseModel):
    id: uuid.UUID
    name: str
    display_title: str
    descricao: str | None
    version: str
    atualizado_em: datetime
    skill_ids: list[uuid.UUID] = []
    subagent_ids: list[uuid.UUID] = []
    mcp_ids: list[uuid.UUID] = []

    model_config = {"from_attributes": True}


class PluginCreate(BaseModel):
    name: str
    display_title: str
    descricao: str | None = None
    version: str = "0.1.0"
    skill_ids: list[uuid.UUID] = []
    subagent_ids: list[uuid.UUID] = []
    mcp_ids: list[uuid.UUID] = []


class PluginUpdate(BaseModel):
    display_title: str | None = None
    descricao: str | None = None
    version: str | None = None
    skill_ids: list[uuid.UUID] | None = None
    subagent_ids: list[uuid.UUID] | None = None
    mcp_ids: list[uuid.UUID] | None = None
