import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Phone } from '@/components/Phone';
import { useMovie } from '@/hooks/queries/useMovie';
import { useTheme } from '@/theme';
import { MovieScreen } from '@/screens/MovieScreen';
import { MovieFromChartScreen } from '@/screens/MovieFromChartScreen';

function MovieDeepLink({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const movieId = parseInt(id, 10);
  const { isLoading, isError } = useMovie(movieId);

  if (isLoading) {
    return (
      <Phone>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.ink} />
        </View>
      </Phone>
    );
  }

  if (isError) {
    return (
      <MovieFromChartScreen
        movieId={id}
        onOpenCard={() => router.replace({ pathname: '/movie/[id]', params: { id } } as any)}
      />
    );
  }

  return <MovieScreen id={id} />;
}

export default function MoviePublicPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MovieDeepLink id={id} />;
}
