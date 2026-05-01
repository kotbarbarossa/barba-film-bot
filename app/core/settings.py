from enum import StrEnum

from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    local = 'local'
    dev = 'dev'
    stage = 'stage'
    prod = 'prod'


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        extra='ignore',
    )

    environment: Environment = Environment.local

    app_name: str = 'movie-bot'

    api_host: str = '0.0.0.0'
    api_port: int = 8000

    database_host: str = 'localhost'
    database_port: int = 5432
    database_user: str = 'postgres'
    database_password: str = 'postgres'
    database_name: str = 'postgres'
    bot_token: str = ''
    groq_api_key: str = ''
    tmdb_api_key: str = ''

    redis_host: str = 'localhost'
    redis_port: int = 6379
    redis_db: int = 0

    sentry_dsn: str = ''

    jwt_secret: str = ''
    jwt_algorithm: str = ''
    access_token_expire_minutes: int = 1
    refresh_token_expire_days: int = 1

    bot_secret: str = ''
    admin_api_key: str = ''
    admin_chat_id: int = 0

    google_client_id: str = ''
    apple_bundle_id: str = ''

    @property
    def redis_url(self) -> str:
        return f'redis://{self.redis_host}:{self.redis_port}/{self.redis_db}'

    @property
    def database_url(self) -> str:
        return (
            'postgresql+asyncpg://'
            f'{self.database_user}:'
            f'{self.database_password}@'
            f'{self.database_host}:'
            f'{self.database_port}/'
            f'{self.database_name}'
        )
