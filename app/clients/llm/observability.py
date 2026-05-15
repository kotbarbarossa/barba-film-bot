from functools import lru_cache

from langfuse import Langfuse

from app.core.config import settings


@lru_cache(maxsize=1)
def get_langfuse() -> Langfuse | None:
    if not settings.langfuse_public_key:
        return None
    return Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_base_url,
    )
