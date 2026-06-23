import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';

/**
 * OAuth redirect landing. Supabase parses the session from the URL on web;
 * once the auth store reflects a session we bounce back to the router root.
 */
export default function AuthCallback() {
  const theme = useTheme();
  const initialized = useAuthStore((s) => s.initialized);

  if (initialized) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <LoadingState label="Signing you in" />
    </View>
  );
}
