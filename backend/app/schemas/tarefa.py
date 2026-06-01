import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

Status = Literal["A Fazer", "Em Andamento", "Em Revisao", "Concluido"]
Prioridade = Literal["baixa", "media", "alta"]


class TarefaCreate(BaseModel):
    titulo: str
    descricao: str | None = None
    prazo: datetime | None = None
    prioridade: Prioridade = "media"
    projeto_id: uuid.UUID | None = None
    status: Status = "A Fazer"
    publicavel: bool = False


class TarefaUpdate(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    prazo: datetime | None = None
    prioridade: Prioridade | None = None
    projeto_id: uuid.UUID | None = None
    publicavel: bool | None = None


class TarefaStatusUpdate(BaseModel):
    status: Status


class TarefaResponse(BaseModel):
    id: uuid.UUID
    titulo: str
    descricao: str | None
    status: str
    prioridade: str
    prazo: datetime | None
    projeto_id: uuid.UUID | None
    publicavel: bool
    retornou_de_revisao: bool
    revisao_retornos: int
    criado_em: datetime
    atualizado_em: datetime

    model_config = {"from_attributes": True}
