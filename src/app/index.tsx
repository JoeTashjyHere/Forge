import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { useTheme } from '@/hooks/use-theme';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';

export default function Index() {
  const theme = useTheme();
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const onboarded = useAuthStore((s) => s.profile?.onboardingCompleted ?? false);

  if (!initialized) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <LoadingState label="Loading Forge" />
      </View>
    );
  }

  if (!isAuthed) return <Redirect href="/auth/login" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
