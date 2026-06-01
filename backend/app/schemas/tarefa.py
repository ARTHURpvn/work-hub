import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator

Status = Literal["A Fazer", "Em Andamento", "Em Revisao", "Concluido"]
Prioridade = Literal["baixa", "media", "alta"]


class SubtarefaCreate(BaseModel):
    titulo: str

    @field_validator("titulo")
    @classmethod
    def nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("titulo não pode ser vazio")
        return v.strip()


class SubtarefaUpdate(BaseModel):
    titulo: str | None = None
    concluida: bool | None = None


class SubtarefaResponse(BaseModel):
    id: uuid.UUID
    titulo: str
    concluida: bool
    ordem: int

    model_config = {"from_attributes": True}


class TarefaLinkCreate(BaseModel):
    label: str
    url: str

    @field_validator("url")
    @classmethod
    def url_valida(cls, v: str) -> str:
        v = v.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL deve começar com http:// ou https://")
        return v

    @field_validator("label")
    @classmethod
    def label_nao_vazio(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("label não pode ser vazio")
        return v.strip()


class TarefaLinkResponse(BaseModel):
    id: uuid.UUID
    label: str
    url: str

    model_config = {"from_attributes": True}


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
    subtarefas: list[SubtarefaResponse] = []
    links: list[TarefaLinkResponse] = []

    model_config = {"from_attributes": True}
