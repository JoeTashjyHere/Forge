import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { Spacing } from '@/constants/theme';
import { BUILDER_ARCHETYPES, type BuilderArchetype } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function Archetype() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<BuilderArchetype | null>(data.archetype);

  const onNext = () => {
    update({ archetype: selected });
    router.push('/onboarding/availability');
  };

  return (
    <OnboardingStep
      step={4}
      total={8}
      title="Your builder archetype"
      subtitle="Choose the identity that fits you best. This shapes who you team up with."
      onNext={onNext}
      nextDisabled={!selected}
    >
      <View style={{ gap: Spacing.three }}>
        {BUILDER_ARCHETYPES.map((a) => (
          <OptionCard
            key={a.key}
            title={a.key}
            description={a.description}
            selected={selected === a.key}
            onPress={() => setSelected(a.key)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
