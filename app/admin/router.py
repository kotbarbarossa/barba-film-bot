from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.movie_use_cases import (
    BackfillEnglishFieldsUseCase,
    ReplacePosterUseCase,
    ReprocessMovieUseCase,
)
from app.admin.schemas import ReprocessRequest
from app.core.auth import require_admin
from app.infrastructure import arq_pool
from app.infrastructure.database.dependencies import get_session
from app.movie.models import ProcessingStatus
from app.movie.repository import MovieFilter, MovieRepository

admin_router = APIRouter(prefix='/admin', tags=['admin'], dependencies=[Depends(require_admin)])


@admin_router.post('/movies/reprocess-pending', response_model=dict[str, int])
async def reprocess_pending_movies(
    session: AsyncSession = Depends(get_session),
) -> dict[str, int]:
    movies = await MovieRepository(session).get_filtered(
        MovieFilter(processing_status=ProcessingStatus.PENDING)
    )
    pool = arq_pool.get()
    for movie in movies:
        await pool.enqueue_job('process_movie', movie_id=movie.id)
    return {'enqueued': len(movies)}


@admin_router.post('/movies/backfill-english-fields', response_model=dict[str, int])
async def backfill_english_fields(
    session: AsyncSession = Depends(get_session),
) -> dict[str, int]:
    return await BackfillEnglishFieldsUseCase(session).execute()


@admin_router.post('/movies/{movie_id}/reprocess', response_model=dict[str, int | str])
async def reprocess_movie(
    movie_id: int,
    body: ReprocessRequest,
    session: AsyncSession = Depends(get_session),
) -> dict[str, int | str]:
    try:
        await ReprocessMovieUseCase(session).execute(
            movie_id=movie_id,
            title=body.title,
            media_type=body.media_type,
            user_query=body.user_query,
            year=body.year,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    return {'movie_id': movie_id, 'status': 'pending'}


@admin_router.post('/movies/{movie_id}/replace-poster', response_model=dict[str, int | str])
async def replace_movie_poster(
    movie_id: int,
    session: AsyncSession = Depends(get_session),
) -> dict[str, int | str]:
    try:
        await ReplacePosterUseCase(session).execute(movie_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    return {'movie_id': movie_id, 'status': 'updated'}
