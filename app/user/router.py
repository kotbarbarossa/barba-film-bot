# app/user/router.py

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.dependencies import get_session
from app.user.models import AuthProvider
from app.user.repository import UserFilter, UserRepository
from app.user.schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix='/users', tags=['users'])


@router.post('/', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)

    existing = await repo.get_by_provider(
        data.provider,
        data.provider_user_id,
    )
    if existing:
        response.status_code = status.HTTP_200_OK
        return existing

    user = await repo.create(**data.model_dump())

    return user


@router.get('/{user_id}', response_model=UserResponse)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)

    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return user


@router.get('/', response_model=list[UserResponse])
async def list_users(
    provider: AuthProvider | None = Query(default=None),
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    return await repo.get_filtered(UserFilter(provider=provider, search=search))


@router.put('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)

    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    return await repo.update(user, data.model_dump())


@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)

    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')

    await repo.delete(user)
