import type { Language } from '@/store/settings.store';

export function movieTitle(
  movie: { title_ru?: string | null; title_original?: string | null },
  lang: Language,
): string {
  if (lang === 'en') return movie.title_original ?? movie.title_ru ?? '';
  return movie.title_ru ?? movie.title_original ?? '';
}

export function genreName(
  genre: { name: string; name_original?: string | null },
  lang: Language,
): string {
  if (lang === 'en') return genre.name_original ?? genre.name;
  return genre.name;
}

export function personName(
  person: { name: string; original_name?: string | null },
  lang: Language,
): string {
  if (lang === 'en') return person.original_name ?? person.name;
  return person.name;
}
