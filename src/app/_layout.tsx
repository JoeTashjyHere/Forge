import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Brand, Colors } from '@/constants/theme';
import { useScheme } from '@/hooks/use-theme';
import { applyWebMeta } from '@/lib/webMeta';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

function buildNavTheme(scheme: 'light' | 'dark'): typeof DefaultTheme {
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: Brand.electricBlue,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      notification: Brand.danger,
    },
  };
}

export default function RootLayout() {
  const scheme = useScheme();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    void initialize();
    if (Platform.OS === 'web') applyWebMeta();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={buildNavTheme(scheme)}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="landing" />
              <Stack.Screen name="beta/index" />
              <Stack.Screen name="beta/admin" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="feedback" options={{ presentation: 'modal' }} />
              <Stack.Screen name="legal/privacy" options={{ presentation: 'modal' }} />
              <Stack.Screen name="legal/terms" options={{ presentation: 'modal' }} />
              <Stack.Screen name="projects/create" options={{ presentation: 'modal' }} />
              <Stack.Screen name="ai/coach" options={{ presentation: 'modal' }} />
            </Stack>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
