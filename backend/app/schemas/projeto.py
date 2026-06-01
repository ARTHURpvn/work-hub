import ipaddress
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

from app.schemas.vps import VpsResponse


Origem = Literal["Otavio", "Titan", "Freelas"]


def _validate_url(v: str | None) -> str | None:
    """Aceita apenas URLs http/https. Converte string vazia em None."""
    if v is None:
        return None
    v = v.strip()
    if not v:
        return None
    if not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("URL deve começar com http:// ou https://")
    return v


class MembroCreate(BaseModel):
    nome: str
    contato: str | None = None


class MembroResponse(BaseModel):
    id: uuid.UUID
    nome: str
    contato: str | None

    model_config = {"from_attributes": True}


class ProjetoCreate(BaseModel):
    nome: str
    origem: Origem
    tem_autenticacao: bool = False
    tem_vps: bool = False
    ssh_ip: str | None = None
    vps_id: uuid.UUID | None = None
    github_url: str | None = None
    site_url: str | None = None
    publicavel: bool = False

    _check_github = field_validator("github_url")(_validate_url)
    _check_site = field_validator("site_url")(_validate_url)

    @field_validator("ssh_ip")
    @classmethod
    def validate_ip(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
        except ValueError:
            raise ValueError("ssh_ip deve ser um endereço IP válido (sem porta, usuário ou chave)")
        return v

    @model_validator(mode="after")
    def validate_rn03(self) -> "ProjetoCreate":
        if not self.tem_vps and self.ssh_ip is not None:
            raise ValueError("ssh_ip só pode ser preenchido quando tem_vps é verdadeiro (RN-03)")
        return self


class ProjetoUpdate(BaseModel):
    nome: str | None = None
    origem: Origem | None = None
    tem_autenticacao: bool | None = None
    tem_vps: bool | None = None
    ssh_ip: str | None = None
    vps_id: uuid.UUID | None = None
    github_url: str | None = None
    site_url: str | None = None
    publicavel: bool | None = None
    arquivado: bool | None = None

    _check_github = field_validator("github_url")(_validate_url)
    _check_site = field_validator("site_url")(_validate_url)

    @field_validator("ssh_ip")
    @classmethod
    def validate_ip(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            ipaddress.ip_address(v)
        except ValueError:
            raise ValueError("ssh_ip deve ser um endereço IP válido (sem porta, usuário ou chave)")
        return v

    @model_validator(mode="after")
    def validate_rn03(self) -> "ProjetoUpdate":
        if self.tem_vps is False and self.ssh_ip is not None:
            raise ValueError("ssh_ip deve ser nulo quando tem_vps é falso (RN-03)")
        return self


class ProjetoResponse(BaseModel):
    id: uuid.UUID
    nome: str
    origem: str
    tem_autenticacao: bool
    tem_vps: bool
    ssh_ip: str | None
    vps_id: uuid.UUID | None
    github_url: str | None
    site_url: str | None
    publicavel: bool
    arquivado: bool
    criado_em: datetime
    membros: list[MembroResponse] = []
    vps: VpsResponse | None = None
    tem_credencial: bool = False

    model_config = {"from_attributes": True}
