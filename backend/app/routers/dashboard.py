from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.deps import get_current_user
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard_service

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_summary(
    _user: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> DashboardSummary:
    return await dashboard_service.build_summary(session)
