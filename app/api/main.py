import uvicorn
from fastapi import FastAPI

from app.core.config import settings
from app.core.sentry import init_sentry
from app.core.settings import Environment
from app.infrastructure.database.lifespan import lifespan
from app.movie.ops_router import ops_router
from app.movie.router import (
    categories_router,
    movie_persons_router,
    movies_router,
    persons_router,
    user_movies_router,
)
from app.user.router import router as user_router

API_PREFIX = '/api/v1'

init_sentry('api')


def create_app() -> FastAPI:
    app = FastAPI(
        title='Movie Bot API',
        lifespan=lifespan,
    )

    return app


app = create_app()


@app.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok'}


app.include_router(ops_router, prefix=API_PREFIX)
app.include_router(user_router, prefix=API_PREFIX)
app.include_router(movies_router, prefix=API_PREFIX)
app.include_router(movie_persons_router, prefix=API_PREFIX)
app.include_router(persons_router, prefix=API_PREFIX)
app.include_router(categories_router, prefix=API_PREFIX)
app.include_router(user_movies_router, prefix=API_PREFIX)

if __name__ == '__main__':
    uvicorn.run(
        'app.api.main:app',
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == Environment.local,
    )
