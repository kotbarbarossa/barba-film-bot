from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_admin, require_admin_key
from app.infrastructure.database.dependencies import get_session
from app.user.models import AuthProvider, User
from app.user.repository import UserAuthProviderRepository, UserFilter, UserRepository
from app.user.schemas import (
    UserAdminUpdate,
    UserCreate,
    UserDetailAdminResponse,
    UserDetailResponse,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix='/users', tags=['users'])


@router.post(
    '/',
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
async def create_user(
    data: UserCreate,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    uap_repo = UserAuthProviderRepository(session)

    existing = await repo.get_by_provider(data.provider, data.provider_user_id)
    if existing:
        response.status_code = status.HTTP_200_OK
        return existing

    user = await repo.create(
        username=data.username,
        first_name=data.first_name,
        last_name=data.last_name,
    )
    await uap_repo.create(
        user_id=user.id,
        provider=data.provider,
        provider_user_id=data.provider_user_id,
    )
    return user


@router.get(
    '/',
    response_model=list[UserResponse],
    dependencies=[Depends(require_admin)],
)
async def list_users(
    provider: AuthProvider | None = Query(default=None),
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    return await repo.get_filtered(UserFilter(provider=provider, search=search))


@router.get('/{user_id}', response_model=UserDetailAdminResponse | UserDetailResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')
    repo = UserRepository(session)
    user = await repo.get_with_providers(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    if current_user.is_admin:
        return UserDetailAdminResponse.model_validate(user)
    return UserDetailResponse.model_validate(user)


@router.put('/{user_id}', response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')
    repo = UserRepository(session)
    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return await repo.update(user, data.model_dump())


@router.patch(
    '/{user_id}/admin',
    response_model=UserResponse,
    dependencies=[Depends(require_admin_key)],
)
async def set_user_admin(
    user_id: int,
    data: UserAdminUpdate,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return await repo.update(user, {'is_admin': data.is_admin})


@router.delete(
    '/{user_id}',
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
async def delete_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
):
    repo = UserRepository(session)
    user = await repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    await repo.delete(user)
