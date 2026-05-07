import { useLocalSearchParams } from 'expo-router';
import { ChartViewScreen } from '@/screens/ChartViewScreen';

export default function ChartPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChartViewScreen chartId={id} />;
}
