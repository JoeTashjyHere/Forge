import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { betaFeedbackSchema, type BetaFeedbackFormInput } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';
import { useBetaStore } from '@/store/betaStore';

export default function Feedback() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const submitFeedback = useBetaStore((s) => s.submitFeedback);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BetaFeedbackFormInput>({
    resolver: zodResolver(betaFeedbackSchema),
    defaultValues: {
      whatWorked: '',
      whatConfused: '',
      whatExpected: '',
      wouldUseAgain: undefined as unknown as boolean,
      rating: 0,
    },
  });

  const onSubmit = async (values: BetaFeedbackFormInput) => {
    setSubmitting(true);
    try {
      await submitFeedback(
        {
          whatWorked: values.whatWorked ?? '',
          whatConfused: values.whatConfused ?? '',
          whatExpected: values.whatExpected ?? '',
          wouldUseAgain: values.wouldUseAgain,
          rating: values.rating,
        },
        profile?.id ?? null,
      );
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Screen contentStyle={styles.centered}>
        <View style={[styles.successIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name="heart" size={36} color={theme.tint} />
        </View>
        <Text variant="h2" weight="bold" center>
          Thank you
        </Text>
        <Text tone="secondary" center style={styles.successBody}>
          Your feedback goes straight to the people building Forge. It genuinely shapes what we do
          next.
        </Text>
        <View style={styles.successActions}>
          <Button title="Done" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" style={{ flex: 1 }}>
          Share feedback
        </Text>
      </View>

      <Text variant="h2" weight="bold">
        How is Forge working for you?
      </Text>
      <Text tone="secondary" style={styles.intro}>
        A couple of minutes here helps us make Forge dramatically better for the next builder.
      </Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text variant="label" tone="secondary">
            Overall, how would you rate Forge?
          </Text>
          <Controller
            control={control}
            name="rating"
            render={({ field: { onChange, value } }) => (
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => onChange(n)} hitSlop={6}>
                    <Ionicons
                      name={n <= value ? 'star' : 'star-outline'}
                      size={32}
                      color={n <= value ? theme.tint : theme.textMuted}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          />
          {errors.rating?.message ? (
            <Text variant="small" tone="danger">
              {errors.rating.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text variant="label" tone="secondary">
            Would you use Forge again?
          </Text>
          <Controller
            control={control}
            name="wouldUseAgain"
            render={({ field: { onChange, value } }) => (
              <Segmented<'yes' | 'no'>
                value={value === true ? 'yes' : value === false ? 'no' : ('' as 'yes')}
                onChange={(v) => onChange(v === 'yes')}
                options={[
                  { key: 'yes', label: 'Yes' },
                  { key: 'no', label: 'No' },
                ]}
              />
            )}
          />
          {errors.wouldUseAgain?.message ? (
            <Text variant="small" tone="danger">
              {errors.wouldUseAgain.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="whatWorked"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What worked well?"
              placeholder="The parts that felt great or saved you time."
              multiline
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.whatWorked?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="whatConfused"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What confused you?"
              placeholder="Anything unclear, awkward, or harder than it should be."
              multiline
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.whatConfused?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="whatExpected"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="What did you expect but not find?"
              placeholder="Features or steps you looked for but couldn’t."
              multiline
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.whatExpected?.message}
            />
          )}
        />

        <Button title="Send feedback" loading={submitting} onPress={handleSubmit(onSubmit)} />
        {!isSupabaseConfigured ? (
          <Text variant="small" tone="muted" center>
            Demo mode: feedback is stored on this device only.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  intro: { marginTop: Spacing.two },
  form: { gap: Spacing.five, marginTop: Spacing.five },
  field: { gap: Spacing.two },
  stars: { flexDirection: 'row', gap: Spacing.three },
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
