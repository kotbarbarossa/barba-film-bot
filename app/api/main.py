import uvicorn
from fastapi import FastAPI

from app.core.config import settings
from app.core.settings import Environment
from app.infrastructure.database.lifespan import lifespan
from app.movie.router import (
    movie_persons_router,
    movies_router,
    persons_router,
    user_movies_router,
)
from app.user.router import router as user_router

API_PREFIX = '/api/v1'


def create_app() -> FastAPI:
    app = FastAPI(
        title='Movie Bot API',
        lifespan=lifespan,
    )

    return app


app = create_app()
app.include_router(user_router, prefix=API_PREFIX)
app.include_router(movies_router, prefix=API_PREFIX)
app.include_router(movie_persons_router, prefix=API_PREFIX)
app.include_router(persons_router, prefix=API_PREFIX)
app.include_router(user_movies_router, prefix=API_PREFIX)

if __name__ == '__main__':
    uvicorn.run(
        'app.api.main:app',
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == Environment.local,
    )
