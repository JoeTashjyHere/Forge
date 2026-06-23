import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { Chip } from '@/components/ui/Chip';
import { Spacing } from '@/constants/theme';
import { INTERESTS } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Interests() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<string[]>(data.interests);

  const toggle = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]));

  const onNext = () => {
    update({ interests: selected });
    router.push('/onboarding/archetype');
  };

  return (
    <OnboardingStep
      step={3}
      total={8}
      title="What are you into?"
      subtitle="Pick the industries and topics you want to build in."
      onNext={onNext}
      nextDisabled={selected.length === 0}
    >
      <View style={styles.chips}>
        {INTERESTS.map((i) => (
          <Chip
            key={i.name}
            label={i.name}
            selected={selected.includes(i.name)}
            onPress={() => toggle(i.name)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
