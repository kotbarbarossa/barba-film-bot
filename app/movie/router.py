from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.llm import ClaudeLLMClient, GroqLLMClient, LLMClient, LLMProvider
from app.core.auth import get_current_user, require_admin
from app.core.config import settings
from app.infrastructure.database.dependencies import get_session
from app.movie.models import MediaType, ProcessingStatus, RoleType, WatchStatus
from app.movie.processing_use_case import PreviewMovieUseCase
from app.movie.repository import (
    CategoryFilter,
    CategoryRepository,
    MovieFilter,
    MoviePersonRepository,
    MovieRepository,
    PersonFilter,
    PersonRepository,
    UserMovieFilter,
    UserMovieRepository,
)
from app.movie.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    MovieCreate,
    MovieDetailResponse,
    MovieListResponse,
    MoviePersonCreate,
    MoviePreviewGet,
    MoviePreviewResponse,
    MovieUpdate,
    PersonCreate,
    PersonInMovieResponse,
    PersonResponse,
    PersonUpdate,
    UserMovieAddByTitle,
    UserMovieDetailResponse,
    UserMovieListResponse,
    UserMovieUpdate,
)
from app.movie.use_cases import AddMovieToUserUseCase, CreateMovieUseCase
from app.user.models import User

movies_router = APIRouter(prefix='/movies', tags=['movies'])
movie_persons_router = APIRouter(
    prefix='/movies/{movie_id}/persons',
    tags=['movie-persons'],
    dependencies=[Depends(require_admin)],
)
persons_router = APIRouter(prefix='/persons', tags=['persons'])
categories_router = APIRouter(prefix='/categories', tags=['categories'])
user_movies_router = APIRouter(
    prefix='/users/{user_id}/movies',
    tags=['user-movies'],
    dependencies=[Depends(get_current_user)],
)


def _require_own_user(user_id: int, current_user: User) -> None:
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')


def _build_llm(provider: LLMProvider) -> LLMClient:
    if provider == LLMProvider.claude:
        if not settings.anthropic_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Anthropic API key not configured',
            )
        return ClaudeLLMClient(api_key=settings.anthropic_api_key, model=settings.anthropic_model)
    return GroqLLMClient(api_key=settings.groq_api_key, model=settings.groq_model)


# --- Movies ---


@movies_router.post(
    '/preview',
    response_model=MoviePreviewResponse | None,
    dependencies=[Depends(require_admin)],
)
async def preview_movie(data: MoviePreviewGet):
    return await PreviewMovieUseCase(_build_llm(data.llm)).execute(
        title=data.title,
        media_type=data.media_type,
        user_query=data.user_query,
        year=data.year,
    )


@movies_router.get(
    '', response_model=list[MovieListResponse], dependencies=[Depends(get_current_user)]
)
async def list_movies(
    media_type: MediaType | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    search: str | None = Query(default=None),
    processing_status: ProcessingStatus | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    return await repo.get_filtered(
        MovieFilter(
            media_type=media_type,
            year_from=year_from,
            year_to=year_to,
            category_id=category_id,
            search=search,
            processing_status=processing_status,
        )
    )


@movies_router.post(
    '',
    response_model=MovieListResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_movie(
    data: MovieCreate,
    session: AsyncSession = Depends(get_session),
):
    use_case = CreateMovieUseCase(session)
    return await use_case.execute(
        title_ru=data.title_ru,
        title_original=data.title_original,
        media_type=data.media_type,
        user_query=data.user_query,
    )


@movies_router.get(
    '/{movie_id}', response_model=MovieDetailResponse, dependencies=[Depends(get_current_user)]
)
async def get_movie(
    movie_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    movie = await repo.get_detail(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')
    return movie


@movies_router.put(
    '/{movie_id}',
    response_model=MovieDetailResponse,
    dependencies=[Depends(require_admin)],
)
async def update_movie(
    movie_id: int,
    data: MovieUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = MovieRepository(session)
    movie = await repo.get_detail(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')

    if data.category_ids is not None:
        categories = await CategoryRepository(session).get_many(data.category_ids)
        if len(categories) != len(data.category_ids):
            raise HTTPException(status_code=422, detail='One or more category IDs not found')
        movie.categories = categories

    scalar_data = data.model_dump(exclude_none=True, exclude={'category_ids'})
    await repo.update(movie, scalar_data)
    return await repo.get_detail(movie_id)


@movies_router.delete(
    '/{movie_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_movie(
    movie_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = MovieRepository(session)
    movie = await repo.get(movie_id)
    if not movie:
        raise HTTPException(status_code=404, detail='Movie not found')
    await repo.delete(movie)


# --- Movie persons ---


@movie_persons_router.post(
    '', response_model=PersonInMovieResponse, status_code=status.HTTP_201_CREATED
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
) -> None:
    repo = MoviePersonRepository(session)
    entry = await repo.get(movie_id, person_id, role_type)
    if not entry:
        raise HTTPException(status_code=404, detail='Assignment not found')
    await repo.delete(entry)


# --- Persons ---


@persons_router.get(
    '', response_model=list[PersonResponse], dependencies=[Depends(get_current_user)]
)
async def list_persons(
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    return await repo.get_filtered(PersonFilter(name=search))


@persons_router.post(
    '',
    response_model=PersonResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_person(
    data: PersonCreate,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    return await repo.create(**data.model_dump())


@persons_router.get(
    '/{person_id}', response_model=PersonResponse, dependencies=[Depends(get_current_user)]
)
async def get_person(
    person_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = PersonRepository(session)
    person = await repo.get(person_id)
    if not person:
        raise HTTPException(status_code=404, detail='Person not found')
    return person


@persons_router.put(
    '/{person_id}',
    response_model=PersonResponse,
    dependencies=[Depends(require_admin)],
)
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


@persons_router.delete(
    '/{person_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_person(
    person_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = PersonRepository(session)
    person = await repo.get(person_id)
    if not person:
        raise HTTPException(status_code=404, detail='Person not found')
    await repo.delete(person)


# --- Categories ---


@categories_router.get(
    '', response_model=list[CategoryResponse], dependencies=[Depends(get_current_user)]
)
async def list_categories(
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = CategoryRepository(session)
    return await repo.get_filtered(CategoryFilter(search=search))


@categories_router.post(
    '',
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_category(
    data: CategoryCreate,
    session: AsyncSession = Depends(get_session),
):
    repo = CategoryRepository(session)
    return await repo.create(name=data.name, name_original=data.name_original)


@categories_router.get(
    '/{category_id}', response_model=CategoryResponse, dependencies=[Depends(get_current_user)]
)
async def get_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = CategoryRepository(session)
    category = await repo.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail='Category not found')
    return category


@categories_router.put(
    '/{category_id}',
    response_model=CategoryResponse,
    dependencies=[Depends(require_admin)],
)
async def update_category(
    category_id: int,
    data: CategoryUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = CategoryRepository(session)
    category = await repo.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail='Category not found')
    return await repo.update(category, data.model_dump(exclude_none=True))


@categories_router.delete(
    '/{category_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_category(
    category_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    repo = CategoryRepository(session)
    category = await repo.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail='Category not found')
    await repo.delete(category)


# --- User movies ---


@user_movies_router.get('', response_model=list[UserMovieListResponse])
async def list_user_movies(
    user_id: int,
    current_user: User = Depends(get_current_user),
    watch_status: WatchStatus | None = Query(default=None, alias='status'),
    is_favorite: bool | None = Query(default=None),
    search: str | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
    repo = UserMovieRepository(session)
    return await repo.get_filtered(
        UserMovieFilter(
            user_id=user_id,
            status=watch_status,
            is_favorite=is_favorite,
            search=search,
            year_from=year_from,
            year_to=year_to,
            category_id=category_id,
        )
    )


@user_movies_router.post(
    '', response_model=UserMovieDetailResponse, status_code=status.HTTP_201_CREATED
)
async def add_user_movie(
    user_id: int,
    data: UserMovieAddByTitle,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
    use_case = AddMovieToUserUseCase(session)
    movie, _ = await use_case.execute(
        user_id=user_id,
        title=data.title,
        media_type=data.media_type,
        user_query=data.user_query,
        year=data.year,
    )
    repo = UserMovieRepository(session)
    return await repo.get_detail(user_id, movie.id)


@user_movies_router.get('/categories', response_model=list[CategoryResponse])
async def list_user_movie_categories(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
    repo = CategoryRepository(session)
    return await repo.get_by_user_processed(user_id)


@user_movies_router.get('/{movie_id}', response_model=UserMovieDetailResponse)
async def get_user_movie(
    user_id: int,
    movie_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
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
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
    repo = UserMovieRepository(session)
    entry = await repo.get_by_user_and_movie(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    await repo.update(entry, data.model_dump(exclude_unset=True))
    return await repo.get_detail(user_id, movie_id)


@user_movies_router.post('/{movie_id}/watched', response_model=UserMovieDetailResponse)
async def mark_user_movie_watched(
    user_id: int,
    movie_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    _require_own_user(user_id, current_user)
    repo = UserMovieRepository(session)
    entry = await repo.mark_watched(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    return await repo.get_detail(user_id, movie_id)


@user_movies_router.delete('/{movie_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_movie(
    user_id: int,
    movie_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    _require_own_user(user_id, current_user)
    repo = UserMovieRepository(session)
    entry = await repo.get_by_user_and_movie(user_id, movie_id)
    if not entry:
        raise HTTPException(status_code=404, detail='Movie not found in list')
    await repo.delete(entry)
