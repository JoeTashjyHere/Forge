import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { ModeBanner } from '@/components/forge/ModeBanner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { BUILDER_TYPES, betaInviteSchema, type BetaInviteFormInput } from '@/lib/validators';
import { useBetaStore } from '@/store/betaStore';

export default function BetaInvite() {
  const router = useRouter();
  const theme = useTheme();
  const submitInvite = useBetaStore((s) => s.submitInvite);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BetaInviteFormInput>({
    resolver: zodResolver(betaInviteSchema),
    defaultValues: { name: '', email: '', role: '', builderType: 'Builder', building: '' },
  });

  const onSubmit = async (values: BetaInviteFormInput) => {
    setSubmitting(true);
    try {
      const result = await submitInvite(values);
      if (result === 'error') {
        setError('email', { message: 'Something went wrong. Please try again.' });
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen contentStyle={styles.centered}>
        <View style={[styles.successIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="checkmark-circle" size={40} color={theme.success} />
        </View>
        <Text variant="h2" weight="bold" center>
          You’re on the list
        </Text>
        <Text tone="secondary" center style={styles.successBody}>
          Thanks for your interest in Forge. We’re onboarding builders in small waves — we’ll email
          you when your spot opens up.
        </Text>
        {!isSupabaseConfigured ? (
          <Text variant="small" tone="muted" center style={{ marginTop: Spacing.two }}>
            Demo mode: this submission was not saved. Connect Supabase to capture real signups.
          </Text>
        ) : null}
        <View style={styles.successActions}>
          <Button title="Back to home" variant="secondary" onPress={() => router.replace('/landing')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" style={{ flex: 1 }}>
          Join the Beta
        </Text>
      </View>

      <Text variant="h1" weight="bold" style={styles.title}>
        Build with Forge
      </Text>
      <Text tone="secondary" style={styles.intro}>
        Forge helps ambitious people turn ideas into real projects — with an AI coach that plans the
        work, matching to find the right teammates, and a clear path from first step to launch.
        We’re inviting our first 100 builders. Tell us a little about you.
      </Text>
      <View style={styles.modeRow}>
        <ModeBanner demoOnly />
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Your name"
              placeholder="Jordan Ellis"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="role"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Your role or background"
              placeholder="e.g. Indie hacker, ex-fintech PM"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.role?.message}
            />
          )}
        />

        <View style={styles.field}>
          <Text variant="label" tone="secondary">
            What best describes you?
          </Text>
          <Controller
            control={control}
            name="builderType"
            render={({ field: { onChange, value } }) => (
              <Segmented
                wrap
                value={value}
                onChange={onChange}
                options={BUILDER_TYPES.map((t) => ({ key: t, label: t }))}
              />
            )}
          />
          {errors.builderType?.message ? (
            <Text variant="small" tone="danger">
              {errors.builderType.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="building"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What do you want to build?"
              placeholder="A one-liner about your idea or the kind of project you want to start."
              multiline
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.building?.message}
            />
          )}
        />

        <Button title="Join the Beta" loading={submitting} onPress={handleSubmit(onSubmit)} />
        <Text variant="small" tone="muted" center>
          Already have an account?{' '}
          <Text variant="small" tone="tint" weight="semibold" onPress={() => router.push('/auth/login')}>
            Sign in
          </Text>
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  title: { marginTop: Spacing.two },
  intro: { marginTop: Spacing.two },
  modeRow: { flexDirection: 'row', marginTop: Spacing.three },
  form: { gap: Spacing.four, marginTop: Spacing.five },
  field: { gap: Spacing.two },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  successBody: { maxWidth: 360, marginTop: Spacing.two },
  successActions: { marginTop: Spacing.five, alignSelf: 'stretch', maxWidth: 360, width: '100%' },
});
