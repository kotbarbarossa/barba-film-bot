from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import Float, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.schemas import ChartEntry
from app.movie.models import Movie, ProcessingStatus, UserMovie, WatchStatus

_K = 0.05
_WINDOW_TRENDING = 60
_WINDOW_RATED = 90
_WINDOW_WANT = 30
_WINDOW_WATCHED = 30
_WINDOW_CONTROVERSIAL = 90
_WINDOW_QUICK = 30
_WINDOW_POSTPONED_MIN = 90


def _avg_rating_subq():
    return (
        select(func.avg(cast(UserMovie.rating, Float)))
        .where(
            UserMovie.movie_id == Movie.id,
            UserMovie.status == WatchStatus.WATCHED,
            UserMovie.rating.is_not(None),
        )
        .correlate(Movie)
        .scalar_subquery()
        .label('avg_rating')
    )


def _base_movie_cols():
    return (
        Movie.id.label('movie_id'),
        Movie.title_ru,
        Movie.title_original,
        Movie.poster_url,
        Movie.poster_url_original,
        Movie.year,
        Movie.media_type,
        Movie.imdb_rating,
        _avg_rating_subq(),
    )


class DiscoveryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_global_trending(self, *, min_count: int, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_TRENDING)

        days_since = func.extract('epoch', func.now() - UserMovie.watched_at) / 86400.0
        effective_days = days_since / (1 + UserMovie.rewatch_count)
        contribution = cast(UserMovie.rating, Float) / (1 + _K * effective_days)
        score_expr = func.sum(contribution) / func.count(UserMovie.user_id)

        stmt = (
            select(
                *_base_movie_cols(),
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

        return await self._fetch_entries(stmt)

    async def get_all_time_top(self, *, limit: int = 10) -> list[ChartEntry]:
        avg_score = func.avg(cast(UserMovie.rating, Float))

        stmt = (
            select(
                *_base_movie_cols(),
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

        return await self._fetch_entries(stmt)

    async def get_top_rated(self, *, min_count: int, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_RATED)
        avg_score = func.avg(cast(UserMovie.rating, Float))

        stmt = (
            select(
                *_base_movie_cols(),
                func.count(UserMovie.user_id).label('watch_count'),
                avg_score.label('score'),
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
            .order_by(avg_score.desc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def get_top_want(
        self, *, window_days: int | None = _WINDOW_WANT, limit: int = 10
    ) -> list[ChartEntry]:
        count_expr = func.count(UserMovie.user_id)
        conditions = [
            UserMovie.status == WatchStatus.WANT,
            Movie.processing_status == ProcessingStatus.PROCESSED,
        ]
        if window_days is not None:
            window_start = datetime.now(UTC) - timedelta(days=window_days)
            conditions.append(UserMovie.added_at >= window_start)

        stmt = (
            select(
                *_base_movie_cols(),
                count_expr.label('watch_count'),
                count_expr.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(*conditions)
            .group_by(Movie.id)
            .order_by(count_expr.desc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def get_top_watched(self, *, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_WATCHED)
        user_count = func.count(UserMovie.user_id)
        score_expr = func.sum(UserMovie.rewatch_count + 1)

        stmt = (
            select(
                *_base_movie_cols(),
                user_count.label('watch_count'),
                score_expr.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.status == WatchStatus.WATCHED,
                UserMovie.watched_at >= window_start,
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .group_by(Movie.id)
            .order_by(score_expr.desc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def get_top_controversial(self, *, min_count: int, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_CONTROVERSIAL)
        stddev_expr = func.stddev(cast(UserMovie.rating, Float))

        stmt = (
            select(
                *_base_movie_cols(),
                func.count(UserMovie.user_id).label('watch_count'),
                stddev_expr.label('score'),
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
            .order_by(stddev_expr.desc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def get_top_quick(self, *, min_count: int, limit: int = 10) -> list[ChartEntry]:
        window_start = datetime.now(UTC) - timedelta(days=_WINDOW_QUICK)
        avg_days = func.avg(
            func.extract('epoch', UserMovie.watched_at - UserMovie.added_at) / 86400.0
        )

        stmt = (
            select(
                *_base_movie_cols(),
                func.count(UserMovie.user_id).label('watch_count'),
                avg_days.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.status == WatchStatus.WATCHED,
                UserMovie.watched_at >= window_start,
                UserMovie.watched_at.is_not(None),
                UserMovie.added_at.is_not(None),
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .group_by(Movie.id)
            .having(func.count(UserMovie.user_id) >= min_count)
            .order_by(avg_days.asc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def get_top_postponed(
        self, *, older_than_days: int | None = _WINDOW_POSTPONED_MIN, limit: int = 10
    ) -> list[ChartEntry]:
        count_expr = func.count(UserMovie.user_id)
        conditions = [
            UserMovie.status == WatchStatus.WANT,
            Movie.processing_status == ProcessingStatus.PROCESSED,
        ]
        if older_than_days is not None:
            cutoff = datetime.now(UTC) - timedelta(days=older_than_days)
            conditions.append(UserMovie.added_at <= cutoff)

        stmt = (
            select(
                *_base_movie_cols(),
                count_expr.label('watch_count'),
                count_expr.label('score'),
            )
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(*conditions)
            .group_by(Movie.id)
            .order_by(count_expr.desc())
            .limit(limit)
        )

        return await self._fetch_entries(stmt)

    async def _fetch_entries(self, stmt: Any) -> list[ChartEntry]:
        result = await self.session.execute(stmt)
        return [
            ChartEntry(
                movie_id=row.movie_id,
                title_ru=row.title_ru,
                title_original=row.title_original,
                poster_url=row.poster_url,
                poster_url_original=row.poster_url_original,
                year=row.year,
                media_type=row.media_type,
                watch_count=row.watch_count,
                score=round(float(row.score), 2) if row.score is not None else 0.0,
                imdb_rating=(
                    round(float(row.imdb_rating), 1) if row.imdb_rating is not None else None
                ),
                avg_rating=(
                    round(float(row.avg_rating), 2) if row.avg_rating is not None else None
                ),
            )
            for row in result
        ]
