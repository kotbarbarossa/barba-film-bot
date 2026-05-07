import { create } from 'zustand';
import type { UserMovieFilters, WatchStatus } from '@/types/api';

export type StatusFilter = 'all' | WatchStatus;
export type MediaTypeFilter = 'all' | 'film' | 'series';
export type SortOption = 'added_desc' | 'year_desc' | 'rating_desc' | 'watched_first';

export interface FiltersState {
  search: string;
  status: StatusFilter;
  categoryId: number | null;
  mediaType: MediaTypeFilter;
  yearFrom: number | null;
  yearTo: number | null;
  hasRating: boolean;
  sort: SortOption;
}

interface FiltersActions {
  setFilters: (patch: Partial<FiltersState>) => void;
  reset: () => void;
  toApiFilters: () => UserMovieFilters;
}

const DEFAULT: FiltersState = {
  search: '',
  status: 'all',
  categoryId: null,
  mediaType: 'all',
  yearFrom: null,
  yearTo: null,
  hasRating: false,
  sort: 'added_desc',
};

export const useFiltersStore = create<FiltersState & FiltersActions>((set, get) => ({
  ...DEFAULT,

  setFilters: (patch) => set((s) => ({ ...s, ...patch })),

  reset: () => set(DEFAULT),

  // search stays client-side — don't send to API to avoid refetch on every keystroke
  toApiFilters: (): UserMovieFilters => {
    const { status, categoryId, yearFrom, yearTo } = get();
    return {
      status: status !== 'all' ? status : undefined,
      category_id: categoryId ?? undefined,
      year_from: yearFrom ?? undefined,
      year_to: yearTo ?? undefined,
    };
  },
}));

export function isFiltersActive(f: FiltersState): boolean {
  return (
    f.search !== '' ||
    f.status !== 'all' ||
    f.categoryId !== null ||
    f.mediaType !== 'all' ||
    f.yearFrom !== null ||
    f.yearTo !== null ||
    f.hasRating ||
    f.sort !== 'added_desc'
  );
}
