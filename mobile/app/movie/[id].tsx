import { useLocalSearchParams } from 'expo-router';
import { MovieScreen } from '@/screens/MovieScreen';

export default function MoviePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MovieScreen id={id} />;
}
