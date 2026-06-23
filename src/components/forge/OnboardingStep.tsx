import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

interface OnboardingStepProps {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  canGoBack?: boolean;
}

export function OnboardingStep({
  step,
  total,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  loading,
  canGoBack = true,
}: OnboardingStepProps) {
  const theme = useTheme();
  const router = useRouter();
  const progress = step / total;

  return (
    <Screen
      footer={
        <Button title={nextLabel} onPress={onNext} disabled={nextDisabled} loading={loading} />
      }
    >
      <View style={styles.header}>
        <View style={styles.topRow}>
          {canGoBack && router.canGoBack() ? (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </Pressable>
          ) : (
            <View style={{ width: 24 }} />
          )}
          <Text variant="small" tone="muted">
            Step {step} of {total}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.tint }]}
          />
        </View>
        <Text variant="h2" style={styles.title}>
          {title}
        </Text>
        {subtitle ? <Text tone="secondary">{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 6, borderRadius: Radius.pill },
  title: { marginTop: Spacing.three },
  body: { marginTop: Spacing.five, gap: Spacing.three, flex: 1 },
});
