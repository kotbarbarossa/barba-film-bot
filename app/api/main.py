from fastapi import FastAPI

from app.infrastructure.database.lifespan import lifespan


def create_app() -> FastAPI:
    app = FastAPI(
        title='Movie Bot API',
        lifespan=lifespan,
    )

    return app


app = create_app()
