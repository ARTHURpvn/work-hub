import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

TipoCalendario = Literal["google", "icloud"]


class IntegracaoCreate(BaseModel):
    tipo: TipoCalendario
    # Campos livres da credencial (ex.: apple_id/app_password, client_id/secret...).
    credencial: dict
    ativa: bool = True


class IntegracaoUpdate(BaseModel):
    ativa: bool | None = None
    credencial: dict | None = None


class IntegracaoResponse(BaseModel):
    """Nunca expõe a credencial — apenas indica se há uma salva."""

    id: uuid.UUID
    tipo: str
    ativa: bool
    tem_credencial: bool


class SyncLogResponse(BaseModel):
    id: uuid.UUID
    tarefa_id: uuid.UUID
    integracao_id: uuid.UUID
    resultado: str
    detalhe: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class SyncResultado(BaseModel):
    processados: int
    ok: int
    erro: int
    detalhe: str
