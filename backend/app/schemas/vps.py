import ipaddress
import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


def _validate_ip(v: str) -> str:
    try:
        ipaddress.ip_address(v)
    except ValueError:
        raise ValueError("ip deve ser um endereço IP válido")
    return v


class VpsCreate(BaseModel):
    nome: str | None = None
    ip: str
    provedor: str | None = None

    _check_ip = field_validator("ip")(_validate_ip)


class VpsUpdate(BaseModel):
    nome: str | None = None
    ip: str | None = None
    provedor: str | None = None

    @field_validator("ip")
    @classmethod
    def validate_ip(cls, v: str | None) -> str | None:
        return None if v is None else _validate_ip(v)


class ProjetoResumo(BaseModel):
    """Projeto resumido (sem dados sensíveis) para listar dentro de uma VPS."""

    id: uuid.UUID
    nome: str
    origem: str
    github_url: str | None = None
    site_url: str | None = None

    model_config = {"from_attributes": True}


class VpsResponse(BaseModel):
    id: uuid.UUID
    nome: str | None
    ip: str
    provedor: str | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class VpsComProjetos(VpsResponse):
    """VPS com os projetos hospedados nela (para o resumo 'repositórios por VPS')."""

    projetos: list[ProjetoResumo] = []
