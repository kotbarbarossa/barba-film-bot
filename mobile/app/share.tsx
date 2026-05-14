import { useLocalSearchParams } from 'expo-router';
import { ShareScreen } from '@/screens/ShareScreen';

export default function SharePage() {
  const { id, title, year, rating, posterUrl } = useLocalSearchParams<{
    id: string;
    title: string;
    year: string;
    rating: string;
    posterUrl: string;
  }>();
  return <ShareScreen id={id} title={title} year={year} rating={rating} posterUrl={posterUrl} />;
}
