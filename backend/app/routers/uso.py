from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.uso import ClaudeCodeUso, UsoResumo
from app.services import claude_stats_service, uso_service

router = APIRouter()


@router.get("", response_model=UsoResumo)
async def get_uso(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> UsoResumo:
    return UsoResumo(**await uso_service.resumo(session))


@router.get("/claude-code", response_model=ClaudeCodeUso)
async def get_uso_claude_code(_user: str = Depends(get_current_user)) -> ClaudeCodeUso:
    return ClaudeCodeUso(**claude_stats_service.resumo())
