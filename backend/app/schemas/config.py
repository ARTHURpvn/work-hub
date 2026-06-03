from pydantic import BaseModel


class ConfigItem(BaseModel):
    chave: str
    label: str
    secret: bool
    placeholder: str
    ajuda: str
    configurado: bool
    valor: str | None = None  # só preenchido para não-secretos
    mascara: str | None = None  # só preenchido para secretos configurados


class ConfigUpdate(BaseModel):
    valor: str
