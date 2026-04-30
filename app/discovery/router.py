from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.discovery.schemas import GlobalTrendingResponse
from app.discovery.service import get_global_trending
from app.infrastructure.database.dependencies import get_session
from app.user.models import User

discovery_router = APIRouter(prefix='/discovery', tags=['discovery'])


@discovery_router.get('/global-trending', response_model=GlobalTrendingResponse)
async def global_trending(
    session: AsyncSession = Depends(get_session),
    _: User = Depends(get_current_user),
) -> GlobalTrendingResponse:
    return await get_global_trending(session)
