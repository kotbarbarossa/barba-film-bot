from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure import arq_pool
from app.infrastructure.database.dependencies import get_session
from app.movie.models import MediaType, ProcessingStatus
from app.movie.ops_use_cases import ReprocessMovieUseCase
from app.movie.repository import MovieFilter, MovieRepository

ops_router = APIRouter(prefix='/movies', tags=['ops'])


@ops_router.post('/reprocess-pending', response_model=dict[str, int])
async def reprocess_pending(session: AsyncSession = Depends(get_session)) -> dict[str, int]:
    movies = await MovieRepository(session).get_filtered(
        MovieFilter(processing_status=ProcessingStatus.PENDING)
    )
    pool = arq_pool.get()
    for movie in movies:
        await pool.enqueue_job('process_movie', movie_id=movie.id)
    return {'enqueued': len(movies)}


class ReprocessRequest(BaseModel):
    title: str
    media_type: MediaType
    user_query: str | None = None
    year: int | None = None


@ops_router.post('/{movie_id}/reprocess', response_model=dict[str, int | str])
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
