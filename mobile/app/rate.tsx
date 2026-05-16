import { useLocalSearchParams } from 'expo-router';
import { RatingPromptScreen } from '@/screens/RatingPromptScreen';

export default function RatePage() {
  const { title, movieId, posterUrl } = useLocalSearchParams<{ title: string; movieId: string; posterUrl?: string }>();
  return <RatingPromptScreen title={title} movieId={movieId} posterUrl={posterUrl || undefined} />;
}
