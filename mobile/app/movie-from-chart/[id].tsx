import { useLocalSearchParams } from 'expo-router';
import { MovieFromChartScreen } from '@/screens/MovieFromChartScreen';

export default function MovieFromChartPage() {
  const { id, posterUrl, title, year, score, watchCount, rank, chartTitle } =
    useLocalSearchParams<{
      id: string;
      posterUrl?: string;
      title: string;
      year?: string;
      score?: string;
      watchCount?: string;
      rank?: string;
      chartTitle?: string;
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
      chartTitle={chartTitle}
    />
  );
}
