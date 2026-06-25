import uuid
from datetime import datetime

from pydantic import BaseModel


class DonoCreate(BaseModel):
    nome: str


class DonoResponse(BaseModel):
    id: uuid.UUID
    nome: str
    criado_em: datetime
    projetos_count: int = 0
    vps_count: int = 0
