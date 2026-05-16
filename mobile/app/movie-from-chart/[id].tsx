import { useLocalSearchParams } from 'expo-router';
import { MovieFromChartScreen } from '@/screens/MovieFromChartScreen';

export default function MovieFromChartPage() {
  const { id, posterUrl, title, year, score, watchCount, rank, chartId, avgRating } =
    useLocalSearchParams<{
      id: string;
      posterUrl?: string;
      title: string;
      year?: string;
      score?: string;
      watchCount?: string;
      rank?: string;
      chartId?: string;
      avgRating?: string;
    }>();
  return (
    <MovieFromChartScreen
      movieId={id}
      posterUrl={posterUrl}
      title={title}
      year={year}
      score={score}
      watchCount={watchCount}
      rank={rank}
      chartId={chartId}
      avgRating={avgRating || undefined}
    />
  );
}
