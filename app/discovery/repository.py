from datetime import UTC, datetime, timedelta

from sqlalchemy import Float, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.schemas import ChartEntry
from app.movie.models import Movie, ProcessingStatus, UserMovie, WatchStatus

_K = 0.05
_WINDOW_DAYS = 60


class DiscoveryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_global_trending(self, *, min_count: int, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_DAYS)

        days_since = func.extract('epoch', func.now() - UserMovie.watched_at) / 86400.0
        effective_days = days_since / (1 + UserMovie.rewatch_count)
        contribution = cast(UserMovie.rating, Float) / (1 + _K * effective_days)
        score_expr = func.sum(contribution) / func.count(UserMovie.user_id)

        stmt = (
            select(
                Movie.id.label('movie_id'),
                Movie.title_ru,
                Movie.title_original,
                Movie.poster_url,
                Movie.year,
                Movie.media_type,
                func.count(UserMovie.user_id).label('watch_count'),
                score_expr.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.status == WatchStatus.WATCHED,
                UserMovie.rating.is_not(None),
                UserMovie.watched_at >= window_start,
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .group_by(Movie.id)
            .having(func.count(UserMovie.user_id) >= min_count)
            .order_by(score_expr.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return [
            ChartEntry(
                movie_id=row.movie_id,
                title_ru=row.title_ru,
                title_original=row.title_original,
                poster_url=row.poster_url,
                year=row.year,
                media_type=row.media_type,
                watch_count=row.watch_count,
                score=round(float(row.score), 2),
            )
            for row in result
        ]

    async def get_all_time_top(self, *, limit: int = 10) -> list[ChartEntry]:
        avg_score = func.avg(cast(UserMovie.rating, Float))

        stmt = (
            select(
                Movie.id.label('movie_id'),
                Movie.title_ru,
                Movie.title_original,
                Movie.poster_url,
                Movie.year,
                Movie.media_type,
                func.count(UserMovie.user_id).label('watch_count'),
                avg_score.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.status == WatchStatus.WATCHED,
                UserMovie.rating.is_not(None),
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .group_by(Movie.id)
            .order_by(avg_score.desc())
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return [
            ChartEntry(
                movie_id=row.movie_id,
                title_ru=row.title_ru,
                title_original=row.title_original,
                poster_url=row.poster_url,
                year=row.year,
                media_type=row.media_type,
                watch_count=row.watch_count,
                score=round(float(row.score), 2),
            )
            for row in result
        ]
