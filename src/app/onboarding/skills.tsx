import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PROFICIENCY_LEVELS, SKILLS, type ProficiencyLevel } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Skills() {
  const router = useRouter();
  const theme = useTheme();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState(data.skills);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.find((s) => s.name === name)
        ? prev.filter((s) => s.name !== name)
        : [...prev, { name, proficiency: 'Intermediate' as ProficiencyLevel }],
    );
  };

  const setProficiency = (name: string, proficiency: ProficiencyLevel) => {
    setSelected((prev) => prev.map((s) => (s.name === name ? { ...s, proficiency } : s)));
  };

  const onNext = () => {
    update({ skills: selected });
    router.push('/onboarding/interests');
  };

  return (
    <OnboardingStep
      step={2}
      total={8}
      title="What can you do?"
      subtitle="Select your skills and set your level."
      onNext={onNext}
      nextDisabled={selected.length === 0}
    >
      <View style={styles.chips}>
        {SKILLS.map((s) => (
          <Chip
            key={s.name}
            label={s.name}
            selected={!!selected.find((x) => x.name === s.name)}
            onPress={() => toggle(s.name)}
          />
        ))}
      </View>

      {selected.length > 0 ? (
        <View style={styles.levels}>
          <Text variant="label" tone="secondary">
            Proficiency
          </Text>
          {selected.map((s) => (
            <Card key={s.name} padded>
              <Text weight="semibold" style={{ marginBottom: Spacing.three }}>
                {s.name}
              </Text>
              <View style={styles.segment}>
                {PROFICIENCY_LEVELS.map((level) => {
                  const active = s.proficiency === level;
                  return (
                    <Pressable
                      key={level}
                      onPress={() => setProficiency(s.name, level)}
                      style={[
                        styles.segmentItem,
                        {
                          backgroundColor: active ? theme.tint : theme.backgroundElement,
                          borderColor: active ? theme.tint : theme.border,
                        },
                      ]}
                    >
                      <Text
                        variant="small"
                        style={{ color: active ? theme.textInverse : theme.textSecondary }}
                      >
                        {level}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          ))}
        </View>
      ) : null}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  levels: { gap: Spacing.three, marginTop: Spacing.three },
  segment: { flexDirection: 'row', gap: Spacing.one, flexWrap: 'wrap' },
  segmentItem: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
    borderWidth: 1,
  },
});
