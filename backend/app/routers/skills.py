from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.skill import (
    SkillChatRequest,
    SkillChatResponse,
    SkillCreate,
    SkillMelhoria,
    SkillResponse,
    SkillResumo,
    SkillUpdate,
    validar_slug,
)
from app.services import config_service, skill_service

router = APIRouter()

ORIGENS = {"pessoal", "plugin", "desktop"}


def _check(origem: str, slug: str) -> None:
    if origem not in ORIGENS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="origem inválida")
    try:
        validar_slug(slug)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=list[SkillResumo])
async def list_skills(_user: str = Depends(get_current_user)) -> list[SkillResumo]:
    return [SkillResumo(**s) for s in skill_service.listar()]


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(body: SkillCreate, _user: str = Depends(get_current_user)) -> SkillResponse:
    try:
        skill = skill_service.criar(body.slug, body.name, body.description)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SkillResponse(**skill)


@router.get("/{origem}/{slug}", response_model=SkillResponse)
async def get_skill(origem: str, slug: str, _user: str = Depends(get_current_user)) -> SkillResponse:
    _check(origem, slug)
    skill = skill_service.obter(origem, slug)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    return SkillResponse(**skill)


@router.put("/pessoal/{slug}", response_model=SkillResponse)
async def update_skill(slug: str, body: SkillUpdate, _user: str = Depends(get_current_user)) -> SkillResponse:
    _check("pessoal", slug)
    try:
        skill = skill_service.salvar(slug, body.conteudo)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SkillResponse(**skill)


@router.delete("/pessoal/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(slug: str, _user: str = Depends(get_current_user)) -> None:
    _check("pessoal", slug)
    if not skill_service.excluir(slug):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")


@router.post("/{origem}/{slug}/importar", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def import_skill(origem: str, slug: str, _user: str = Depends(get_current_user)) -> SkillResponse:
    _check(origem, slug)
    try:
        skill = skill_service.importar(origem, slug)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return SkillResponse(**skill)


@router.post("/pessoal/{slug}/melhorar", response_model=SkillMelhoria)
async def melhorar_skill(
    slug: str,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillMelhoria:
    _check("pessoal", slug)
    skill = skill_service.obter("pessoal", slug)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    api_key, model = await config_service.get_anthropic(session)
    try:
        sugestao = await skill_service.melhorar(skill["conteudo"], api_key=api_key, model=model)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    return SkillMelhoria(sugestao=sugestao)


@router.post("/pessoal/{slug}/chat", response_model=SkillChatResponse)
async def chat_skill(
    slug: str,
    body: SkillChatRequest,
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SkillChatResponse:
    _check("pessoal", slug)
    skill = skill_service.obter("pessoal", slug)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill não encontrada")
    mensagens = [m.model_dump() for m in body.mensagens]
    api_key, model = await config_service.get_anthropic(session)
    try:
        resultado = await skill_service.chat(skill["conteudo"], mensagens, api_key=api_key, model=model)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Erro ao chamar a IA: {exc}")
    return SkillChatResponse(**resultado)
