from pydantic import BaseModel

from app.movie.models import MediaType


class ReprocessRequest(BaseModel):
    title: str
    media_type: MediaType
    user_query: str | None = None
    year: int | None = None
