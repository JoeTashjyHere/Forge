import { Redirect, Stack } from 'expo-router';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';

export default function OnboardingLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const onboarded = useAuthStore((s) => s.profile?.onboardingCompleted ?? false);

  if (initialized && !isAuthed) return <Redirect href="/landing" />;
  if (initialized && onboarded) return <Redirect href="/(tabs)/home" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
