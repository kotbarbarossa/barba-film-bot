from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.dependencies import get_session
from app.movie.models import MediaType, RoleType, WatchStatus
from app.movie.repository import (
    MovieFilter,
    MoviePersonRepository,
    MovieRepository,
    PersonFilter,
    PersonRepository,
    UserMovieFilter,
    UserMovieRepository,
)
from app.movie.schemas import (
    MovieCreate,
    MovieDetailResponse,
    MovieListResponse,
    MoviePersonCreate,
    MovieUpdate,
    PersonCreate,
    PersonInMovieResponse,
    PersonResponse,
    PersonUpdate,
    UserMovieCreate,
    UserMovieDetailResponse,
    UserMovieListResponse,
    UserMovieUpdate,
)
from app.movie.use_cases import CreateMovieUseCase

movies_router = APIRouter(prefix='/movies', tags=['movies'])
movie_persons_router = APIRouter(prefix='/movies/{movie_id}/persons', tags=['movie-persons'])
persons_router = APIRouter(prefix='/persons', tags=['persons'])
user_movies_router = APIRouter(prefix='/users/{user_id}/movies', tags=['user-movies'])


# --- Movies ---


@movies_router.get('/', response_model=list[MovieListResponse])
async def list_movies(
    media_type: MediaType | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    category_slug: str | None = Query(default=None),
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    return await repo.get_filtered(
        MovieFilter(
            media_type=media_type,
            year_from=year_from,
            year_to=year_to,
            category_slug=category_slug,
            search=search,
        )
    )


@movies_router.post('/', response_model=MovieListResponse, status_code=status.HTTP_201_CREATED)
async def create_movie(
    data: MovieCreate,
    session: AsyncSession = Depends(get_session),
):
    use_case = CreateMovieUseCase(session)
    return await use_case.execute(title=data.title, media_type=data.media_type)


@movies_router.get('/{movie_id}', response_model=MovieDetailResponse)
async def get_movie(
    movie_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    movie = await repo.get_detail(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')
    return movie


@movies_router.put('/{movie_id}', response_model=MovieDetailResponse)
async def update_movie(
    movie_id: int,
    data: MovieUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    movie = await repo.get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')
    updated = await repo.update(movie, data.model_dump(exclude_none=True))
    return await repo.get_detail(updated.id)


@movies_router.delete('/{movie_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_movie(
    movie_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    movie = await repo.get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')
    await repo.delete(movie)


# --- Movie persons ---


@movie_persons_router.post(
    '/', response_model=PersonInMovieResponse, status_code=status.HTTP_201_CREATED
)
async def assign_person_to_movie(
    movie_id: int,
    data: MoviePersonCreate,
    session: AsyncSession = Depends(get_session),
):
    repo = MoviePersonRepository(session)
    existing = await repo.get(movie_id, data.person_id, data.role_type)
    if existing:
        raise HTTPException(status_code=409, detail='Person already assigned with this role')
    return await repo.create(
        movie_id=movie_id,
        person_id=data.person_id,
        role_type=data.role_type,
        character_name=data.character_name,
    )


@movie_persons_router.delete('/{person_id}/{role_type}', status_code=status.HTTP_204_NO_CONTENT)
async def remove_person_from_movie(
    movie_id: int,
    person_id: int,
    role_type: RoleType,
    session: AsyncSession = Depends(get_session),
):
    repo = MoviePersonRepository(session)
    entry = await repo.get(movie_id, person_id, role_type)
    if not entry:
        raise HTTPException(status_code=404, detail='Assignment not found')
    await repo.delete(entry)


# --- Persons ---


@persons_router.get('/', response_model=list[PersonResponse])
async def list_persons(
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    return await repo.get_filtered(PersonFilter(name=search))


@persons_router.post('/', response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    data: PersonCreate,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    return await repo.create(**data.model_dump())


@persons_router.get('/{person_id}', response_model=PersonResponse)
async def get_person(
    person_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    person = await repo.get(person_id)
    if not person:
        raise HTTPException(status_code=404, detail='Person not found')
    return person


@persons_router.put('/{person_id}', response_model=PersonResponse)
async def update_person(
    person_id: int,
    data: PersonUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    person = await repo.get(person_id)
    if not person:
        raise HTTPException(status_code=404, detail='Person not found')
    return await repo.update(person, data.model_dump(exclude_none=True))


@persons_router.delete('/{person_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    person = await repo.get(person_id)
    if not person:
        raise HTTPException(status_code=404, detail='Person not found')
    await repo.delete(person)


# --- User movies ---


@user_movies_router.get('/', response_model=list[UserMovieListResponse])
async def list_user_movies(
    user_id: int,
    status: WatchStatus | None = Query(default=None),
    is_favorite: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    category_slug: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = UserMovieRepository(session)
    return await repo.get_filtered(
        UserMovieFilter(
            user_id=user_id,
            status=status,
            is_favorite=is_favorite,
            search=search,
            year_from=year_from,
            year_to=year_to,
            category_slug=category_slug,
        )
    )


@user_movies_router.post(
    '/', response_model=UserMovieListResponse, status_code=status.HTTP_201_CREATED
)
async def add_user_movie(
    user_id: int,
    data: UserMovieCreate,
    session: AsyncSession = Depends(get_session),
):
    repo = UserMovieRepository(session)
    existing = await repo.get_by_user_and_movie(user_id, data.movie_id)
    if existing:
        raise HTTPException(status_code=409, detail='Movie already in list')
    return await repo.create(user_id=user_id, movie_id=data.movie_id, status=data.status)


@user_movies_router.get('/{movie_id}', response_model=UserMovieDetailResponse)
async def get_user_movie(
    user_id: int,
    movie_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = UserMovieRepository(session)
    entry = await repo.get_detail(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    return entry


@user_movies_router.put('/{movie_id}', response_model=UserMovieDetailResponse)
async def update_user_movie(
    user_id: int,
    movie_id: int,
    data: UserMovieUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = UserMovieRepository(session)
    entry = await repo.get_by_user_and_movie(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    await repo.update(entry, data.model_dump())
    return await repo.get_detail(user_id, movie_id)


@user_movies_router.delete('/{movie_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_movie(
    user_id: int,
    movie_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = UserMovieRepository(session)
    entry = await repo.get_by_user_and_movie(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    await repo.delete(entry)
