import { useLocalSearchParams } from 'expo-router';
import { ShareScreen } from '@/screens/ShareScreen';

export default function SharePage() {
  const { title, year, rating } = useLocalSearchParams<{ title: string; year: string; rating: string }>();
  return <ShareScreen title={title} year={year} rating={rating} />;
}
