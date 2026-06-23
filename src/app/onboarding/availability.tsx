import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { Spacing } from '@/constants/theme';
import { AVAILABILITY_LEVELS, type AvailabilityLevel } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Availability() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<AvailabilityLevel | null>(data.availability);

  const onNext = () => {
    update({ availability: selected });
    router.push('/onboarding/build-stage');
  };

  return (
    <OnboardingStep
      step={5}
      total={8}
      title="How much time can you commit?"
      subtitle="Matching on realistic availability prevents mismatched expectations."
      onNext={onNext}
      nextDisabled={!selected}
    >
      <View style={{ gap: Spacing.three }}>
        {AVAILABILITY_LEVELS.map((a) => (
          <OptionCard
            key={a.key}
            title={a.label}
            selected={selected === a.key}
            onPress={() => setSelected(a.key)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
