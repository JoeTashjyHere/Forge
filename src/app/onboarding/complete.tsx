import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Complete() {
  const router = useRouter();
  const theme = useTheme();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const data = useOnboardingStore((s) => s.data);
  const reset = useOnboardingStore((s) => s.reset);
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await completeOnboarding(data);
        if (active) {
          reset();
          setSaving(false);
        }
      } catch (e: any) {
        if (active) {
          setError(e.message ?? 'Something went wrong saving your profile.');
          setSaving(false);
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (saving) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Setting up your Forge" />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      contentStyle={styles.content}
      footer={
        <Button
          title={error ? 'Try again' : "Let's build"}
          onPress={() => (error ? router.replace('/onboarding/partner-preferences') : router.replace('/(tabs)/home'))}
        />
      }
    >
      <View style={[styles.badge, { backgroundColor: error ? theme.danger + '22' : theme.success + '22' }]}>
        <Ionicons
          name={error ? 'alert-circle' : 'checkmark-circle'}
          size={48}
          color={error ? theme.danger : theme.success}
        />
      </View>
      <Text variant="h2" center>
        {error ? 'We hit a snag' : "You're all set"}
      </Text>
      <Text tone="secondary" center style={styles.body}>
        {error ??
          'Your profile is ready. Forge will use it to recommend collaborators, projects, and your next step.'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  badge: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { maxWidth: 340 },
});
