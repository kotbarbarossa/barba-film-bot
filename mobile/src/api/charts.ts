import { apiClient } from './client';
import type { ChartResponse, ChartSlug, GlobalTrendingResponse } from '@/types/api';

export async function getGlobalTrending(): Promise<GlobalTrendingResponse> {
  const { data } = await apiClient.get<GlobalTrendingResponse>('/discovery/global-trending');
  return data;
}

export async function getChart(slug: Exclude<ChartSlug, 'global-trending'>): Promise<ChartResponse> {
  const { data } = await apiClient.get<ChartResponse>(`/discovery/${slug}`);
  return data;
}
