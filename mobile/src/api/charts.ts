import { apiClient } from './client';
import type { ChartResponse, ChartSlug, GlobalTrendingResponse, MovieChartsResponse } from '@/types/api';

export async function getGlobalTrending(): Promise<GlobalTrendingResponse> {
  const { data } = await apiClient.get<GlobalTrendingResponse>('/discovery/global-trending');
  return data;
}

export async function getChart(slug: Exclude<ChartSlug, 'global-trending'>): Promise<ChartResponse> {
  const { data } = await apiClient.get<ChartResponse>(`/discovery/${slug}`);
  return data;
}

export async function getMovieCharts(movieId: number): Promise<MovieChartsResponse> {
  const { data } = await apiClient.get<MovieChartsResponse>(`/discovery/movie/${movieId}/charts`);
  return data;
}
