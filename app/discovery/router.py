from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.discovery.schemas import (
    ChartResponse,
    GlobalTrendingResponse,
    PublicPosterEntry,
    PublicPostersResponse,
)
from app.discovery.service import (
    get_global_trending,
    get_top_controversial,
    get_top_postponed,
    get_top_quick,
    get_top_rated,
    get_top_want,
    get_top_watched,
)
from app.infrastructure.database.dependencies import get_session
from app.movie.models import Movie, ProcessingStatus

public_discovery_router = APIRouter(prefix='/discovery', tags=['discovery'])

discovery_router = APIRouter(
    prefix='/discovery',
    tags=['discovery'],
    dependencies=[Depends(get_current_user)],
)


@public_discovery_router.get('/recent-posters', response_model=PublicPostersResponse)
async def recent_posters(
    session: AsyncSession = Depends(get_session),
) -> PublicPostersResponse:
    stmt = (
        select(Movie)
        .where(Movie.poster_url.isnot(None))
        .where(Movie.processing_status == ProcessingStatus.PROCESSED)
        .order_by(desc(Movie.created_at))
        .limit(20)
    )
    movies = list((await session.execute(stmt)).scalars().all())
    return PublicPostersResponse(entries=[
        PublicPosterEntry(
            id=m.id,
            title_ru=m.title_ru,
            title_original=m.title_original,
            year=m.year,
            poster_url=m.poster_url,  # type: ignore[arg-type]
        )
        for m in movies
    ])


@discovery_router.get('/global-trending', response_model=GlobalTrendingResponse)
async def global_trending(
    session: AsyncSession = Depends(get_session),
) -> GlobalTrendingResponse:
    return await get_global_trending(session)


@discovery_router.get('/top-rated', response_model=ChartResponse)
async def top_rated(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_rated(session)


@discovery_router.get('/top-want', response_model=ChartResponse)
async def top_want(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_want(session)


@discovery_router.get('/top-watched', response_model=ChartResponse)
async def top_watched(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_watched(session)


@discovery_router.get('/top-controversial', response_model=ChartResponse)
async def top_controversial(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_controversial(session)


@discovery_router.get('/top-quick', response_model=ChartResponse)
async def top_quick(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_quick(session)


@discovery_router.get('/top-postponed', response_model=ChartResponse)
async def top_postponed(
    session: AsyncSession = Depends(get_session),
) -> ChartResponse:
    return await get_top_postponed(session)
