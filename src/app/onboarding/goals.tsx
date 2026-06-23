import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { Chip } from '@/components/ui/Chip';
import { Spacing } from '@/constants/theme';
import { GOALS, type Goal } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Goals() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<Goal[]>(data.goals);

  const toggle = (goal: Goal) =>
    setSelected((prev) => (prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]));

  const onNext = () => {
    update({ goals: selected });
    router.push('/onboarding/partner-preferences');
  };

  return (
    <OnboardingStep
      step={7}
      total={8}
      title="What do you want from Forge?"
      subtitle="Pick the outcomes that matter most to you."
      onNext={onNext}
      nextDisabled={selected.length === 0}
    >
      <View style={styles.chips}>
        {GOALS.map((g) => (
          <Chip key={g} label={g} selected={selected.includes(g)} onPress={() => toggle(g)} />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
