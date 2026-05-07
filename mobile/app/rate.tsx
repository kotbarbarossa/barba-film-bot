import { useLocalSearchParams } from 'expo-router';
import { RatingPromptScreen } from '@/screens/RatingPromptScreen';

export default function RatePage() {
  const { title, movieId } = useLocalSearchParams<{ title: string; movieId: string }>();
  return <RatingPromptScreen title={title} movieId={movieId} />;
}
