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
class SkillArquivoIO(BaseModel):
    """Arquivo auxiliar do bundle (ex.: reference/srs.md, scripts/gerar.py)."""

    caminho: str
    conteudo: str


class SkillArquivoOut(SkillArquivoIO):
    model_config = {"from_attributes": True}


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
    arquivos: list[SkillArquivoOut] = []


class SkillCreate(BaseModel):
    display_title: str
    conteudo: str  # SKILL.md completo (com frontmatter name/description)
    arquivos: list[SkillArquivoIO] = []


class SkillUpdate(BaseModel):
    conteudo: str
    display_title: str | None = None
    arquivos: list[SkillArquivoIO] = []


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


class SkillChatRequest(BaseModel):
    mensagem: str


class SkillChatResponse(BaseModel):
    reply: str
    sugestao_conteudo: str | None = None
    sugestao_arquivos: list[SkillArquivoIO] | None = None
    demonstracao: str | None = None


class SkillChatMsg(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    sugestao_conteudo: str | None = None
    sugestao_arquivos: list[SkillArquivoIO] | None = None
    demonstracao: str | None = None
    criado_em: datetime

    model_config = {"from_attributes": True}


# ---------- Assistente de skills (editar várias / criar em lote) ----------
class AssistenteMensagem(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AssistenteRequest(BaseModel):
    mensagens: list[AssistenteMensagem]


class AssistenteAcao(BaseModel):
    tipo: str  # "criar" | "editar"
    name: str
    display_title: str
    descricao: str | None = None
    conteudo: str
    arquivos: list[SkillArquivoIO] = []


class AssistenteResponse(BaseModel):
    reply: str
    acoes: list[AssistenteAcao]
