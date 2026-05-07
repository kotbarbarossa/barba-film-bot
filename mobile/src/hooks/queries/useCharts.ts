import { useQuery } from '@tanstack/react-query';

import { getChart, getGlobalTrending } from '@/api/charts';
import type { ChartSlug } from '@/types/api';

export const chartKeys = {
  trending: () => ['chart', 'global-trending'] as const,
  chart: (slug: ChartSlug) => ['chart', slug] as const,
};

export function useGlobalTrending() {
  return useQuery({
    queryKey: chartKeys.trending(),
    queryFn: getGlobalTrending,
    staleTime: 1000 * 60 * 5,
  });
}

export function useChart(slug: Exclude<ChartSlug, 'global-trending'>) {
  return useQuery({
    queryKey: chartKeys.chart(slug),
    queryFn: () => getChart(slug),
    staleTime: 1000 * 60 * 5,
  });
}
