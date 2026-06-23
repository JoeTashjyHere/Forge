import { Redirect, Stack } from 'expo-router';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const isAuthed = useAuthStore(selectIsAuthenticated);
  const onboarded = useAuthStore((s) => s.profile?.onboardingCompleted ?? false);

  if (initialized && isAuthed) {
    return <Redirect href={onboarded ? '/(tabs)/home' : '/onboarding'} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
