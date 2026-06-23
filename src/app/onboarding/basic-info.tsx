import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { OnboardingStep } from '@/components/forge/OnboardingStep';
import { Input } from '@/components/ui/Input';
import { Spacing } from '@/constants/theme';
import { basicInfoSchema, type BasicInfoInput } from '@/lib/validators';
import { useOnboardingStore } from '@/store/onboardingStore';

const ONBOARDING_TOTAL = 8;

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

export default function BasicInfo() {
  const router = useRouter();
  const data = useOnboardingStore((s) => s.data);
  const update = useOnboardingStore((s) => s.update);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoInput>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      location: data.location,
      timezone: data.timezone || detectTimezone(),
      occupation: data.occupation,
      yearsExperience: data.yearsExperience,
    },
  });

  const onNext = (values: BasicInfoInput) => {
    update(values);
    router.push('/onboarding/skills');
  };

  return (
    <OnboardingStep
      step={1}
      total={ONBOARDING_TOTAL}
      title="Tell us about you"
      subtitle="The basics help us tailor recommendations."
      onNext={handleSubmit(onNext)}
    >
      <View style={{ gap: Spacing.four }}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input label="First name" value={value} onChangeText={onChange} error={errors.firstName?.message} />
          )}
        />
        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input label="Last name" value={value} onChangeText={onChange} error={errors.lastName?.message} />
          )}
        />
        <Controller
          control={control}
          name="occupation"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Occupation"
              placeholder="e.g. Product Manager"
              value={value}
              onChangeText={onChange}
              error={errors.occupation?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Location"
              placeholder="e.g. New York, NY"
              value={value}
              onChangeText={onChange}
              error={errors.location?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="timezone"
          render={({ field: { onChange, value } }) => (
            <Input label="Timezone" value={value} onChangeText={onChange} error={errors.timezone?.message} />
          )}
        />
        <Controller
          control={control}
          name="yearsExperience"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Years of experience"
              keyboardType="number-pad"
              value={value ? String(value) : ''}
              onChangeText={(t) => onChange(Number(t.replace(/[^0-9]/g, '')) || 0)}
              error={errors.yearsExperience?.message}
            />
          )}
        />
      </View>
    </OnboardingStep>
  );
}
