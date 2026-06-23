import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { OptionCard } from '@/components/ui/OptionCard';
import { Spacing } from '@/constants/theme';
import { PERSONAL_BUILD_STAGES, type PersonalBuildStage } from '@/lib/constants';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function BuildStage() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);
  const [selected, setSelected] = useState<PersonalBuildStage | null>(data.buildStage);

  const onNext = () => {
    update({ buildStage: selected });
    router.push('/onboarding/goals');
  };

  return (
    <OnboardingStep
      step={6}
      total={8}
      title="Where are you right now?"
      subtitle="Your personal build stage helps us meet you where you are."
      onNext={onNext}
      nextDisabled={!selected}
    >
      <View style={{ gap: Spacing.three }}>
        {PERSONAL_BUILD_STAGES.map((s) => (
          <OptionCard
            key={s.key}
            title={s.key}
            description={s.description}
            accentColor={s.color}
            selected={selected === s.key}
            onPress={() => setSelected(s.key)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
