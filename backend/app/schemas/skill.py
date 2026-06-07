import re
import uuid
from datetime import datetime

from pydantic import BaseModel

# Mantido para o skill_service local (fonte da migração).
SLUG_RE = re.compile(r"^[a-zA-Z0-9_-]{1,80}$")


def validar_slug(v: str) -> str:
    v = v.strip()
    if not SLUG_RE.match(v):
        raise ValueError("nome inválido: use apenas letras, números, '-' e '_' (sem espaços ou barras)")
    return v


# ---------- Skills custom (Anthropic Skill Management API) ----------
class SkillResponse(BaseModel):
    id: uuid.UUID
    skill_id: str
    name: str
    display_title: str
    descricao: str | None
    versao_atual: str | None
    atualizado_em: datetime

    model_config = {"from_attributes": True}


class SkillDetalhe(SkillResponse):
    conteudo: str


class SkillCreate(BaseModel):
    display_title: str
    conteudo: str  # SKILL.md completo (com frontmatter name/description)


class SkillUpdate(BaseModel):
    conteudo: str
    display_title: str | None = None


class MigrarErro(BaseModel):
    name: str
    erro: str


class MigrarResultado(BaseModel):
    criadas: int
    puladas: int
    erros: list[MigrarErro]


# ---------- Chat / melhorar (Messages API sobre o conteúdo) ----------
class SkillMelhoria(BaseModel):
    sugestao: str


class ChatMensagem(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class SkillChatRequest(BaseModel):
    mensagens: list[ChatMensagem]


class SkillChatResponse(BaseModel):
    reply: str
    sugestao_conteudo: str | None = None
