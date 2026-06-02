import re

from pydantic import BaseModel, field_validator

SLUG_RE = re.compile(r"^[a-zA-Z0-9_-]{1,80}$")


def validar_slug(v: str) -> str:
    v = v.strip()
    if not SLUG_RE.match(v):
        raise ValueError("nome inválido: use apenas letras, números, '-' e '_' (sem espaços ou barras)")
    return v


class SkillResumo(BaseModel):
    slug: str
    name: str
    description: str | None
    origem: str  # pessoal | plugin | desktop
    editavel: bool


class SkillResponse(BaseModel):
    slug: str
    name: str
    description: str | None
    origem: str
    editavel: bool
    conteudo: str  # SKILL.md completo


class SkillCreate(BaseModel):
    slug: str
    name: str
    description: str = ""

    _check = field_validator("slug")(validar_slug)


class SkillUpdate(BaseModel):
    conteudo: str  # SKILL.md completo


class SkillMelhoria(BaseModel):
    sugestao: str  # SKILL.md melhorado (não salvo automaticamente)


class ChatMensagem(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class SkillChatRequest(BaseModel):
    mensagens: list[ChatMensagem]


class SkillChatResponse(BaseModel):
    reply: str
    sugestao_conteudo: str | None = None
