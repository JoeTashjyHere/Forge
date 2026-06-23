import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  PARTNER_PREFERENCE_DIMENSIONS,
  type PartnerPreferenceDimension,
} from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

const LABELS: Record<PartnerPreferenceDimension, string> = {
  reliability: 'Reliability',
  availability: 'Availability',
  experience: 'Experience',
  leadership: 'Leadership',
  communication: 'Communication',
  technical: 'Technical skills',
};

const LOCAL_OPTIONS: { key: 'local' | 'remote' | 'either'; label: string; desc: string }[] = [
  { key: 'either', label: 'No preference', desc: 'Local or remote both work.' },
  { key: 'remote', label: 'Remote', desc: 'Happy to build with anyone, anywhere.' },
  { key: 'local', label: 'Local', desc: 'Prefer collaborators near me.' },
];

export default function PartnerPreferences() {
  const router = useRouter();
  const theme = useTheme();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);

  const [weights, setWeights] = useState(data.partnerPreferences.weights);
  const [localPreference, setLocalPreference] = useState(data.partnerPreferences.localPreference);

  const onNext = () => {
    update({
      partnerPreferences: { ...data.partnerPreferences, weights, localPreference },
    });
    router.push('/onboarding/complete');
  };

  return (
    <OnboardingStep
      step={8}
      total={8}
      title="What matters in a teammate?"
      subtitle="Rank how important each trait is. These tune your recommendations."
      onNext={onNext}
      nextLabel="Finish"
    >
      <View style={styles.weights}>
        {PARTNER_PREFERENCE_DIMENSIONS.map((dim) => (
          <View key={dim} style={styles.weightRow}>
            <Text variant="label" style={{ flex: 1 }}>
              {LABELS[dim]}
            </Text>
            <View style={styles.dots}>
              {[1, 2, 3, 4, 5].map((n) => {
                const active = n <= weights[dim];
                return (
                  <Pressable
                    key={n}
                    hitSlop={6}
                    onPress={() => setWeights((w) => ({ ...w, [dim]: n }))}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: active ? theme.tint : theme.backgroundElement,
                        borderColor: active ? theme.tint : theme.border,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <Text variant="label" tone="secondary" style={styles.sectionLabel}>
        Collaboration style
      </Text>
      <View style={{ gap: Spacing.three }}>
        {LOCAL_OPTIONS.map((o) => (
          <OptionCard
            key={o.key}
            title={o.label}
            description={o.desc}
            selected={localPreference === o.key}
            onPress={() => setLocalPreference(o.key)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  weights: { gap: Spacing.four },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  dots: { flexDirection: 'row', gap: Spacing.two },
  dot: { width: 22, height: 22, borderRadius: Radius.pill, borderWidth: 1.5 },
  sectionLabel: { marginTop: Spacing.five, marginBottom: Spacing.one },
});
