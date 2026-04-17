import re
from dataclasses import dataclass, field

from app.movie.models import MediaType

_MEDIA_TYPE_KEYWORDS: dict[str, MediaType] = {
    'сериал': MediaType.SERIES,
    'шоу': MediaType.SERIES,
    'фильм': MediaType.FILM,
    'кино': MediaType.FILM,
}

_NOISE_WORDS = {'годов', 'года', 'год'}

_DECADE_RE = re.compile(r'\b(\d{2,4})х\b')
_YEAR_RE = re.compile(r'\b(19|20)\d{2}\b')


@dataclass
class ParsedQuery:
    title: str
    year_from: int | None = field(default=None)
    year_to: int | None = field(default=None)
    media_type: MediaType | None = field(default=None)


def parse_movie_query(text: str) -> ParsedQuery:
    s = text.lower()
    year_from: int | None = None
    year_to: int | None = None
    media_type: MediaType | None = None

    decade_match = _DECADE_RE.search(s)
    if decade_match:
        d = decade_match.group(1)
        base = (
            1900 if len(d) == 2 and int(d) >= 30 else (2000 if len(d) == 2 else int(d) // 10 * 10)
        )
        year_from = (base + int(d)) if len(d) == 2 else int(d)
        year_to = year_from + 9
        s = s[: decade_match.start()] + ' ' + s[decade_match.end() :]
    else:
        year_match = _YEAR_RE.search(s)
        if year_match:
            year_from = year_to = int(year_match.group())
            s = s[: year_match.start()] + ' ' + s[year_match.end() :]

    for keyword, mtype in _MEDIA_TYPE_KEYWORDS.items():
        if re.search(rf'\b{keyword}\b', s):
            media_type = mtype
            s = re.sub(rf'\b{keyword}\b', ' ', s)

    for word in _NOISE_WORDS:
        s = re.sub(rf'\b{word}\b', ' ', s)

    title = ' '.join(s.split())

    return ParsedQuery(title=title, year_from=year_from, year_to=year_to, media_type=media_type)
