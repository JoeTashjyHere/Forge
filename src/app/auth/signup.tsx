import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { BrandHeader } from '@/components/forge/BrandHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { signupSchema, type SignupInput } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';

export default function Signup() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignupInput) => {
    try {
      await signUp(values.email, values.password);
      router.replace('/');
    } catch (e: any) {
      setError('email', { message: e.message ?? 'Unable to sign up' });
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader
        title="Start building"
        subtitle="Find collaborators, get guidance, and ship real things."
      />

      <View style={styles.form}>
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
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="password-new"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <Button title="Create account" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>

      <View style={styles.footer}>
        <Text tone="secondary">Already have an account? </Text>
        <Link href="/auth/login">
          <Text tone="tint" weight="semibold">
            Sign in
          </Text>
        </Link>
      </View>

      {!isSupabaseConfigured ? (
        <Text variant="small" tone="muted" center style={styles.demo}>
          Demo mode: your account is stored locally on this device.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: Spacing.five },
  form: { gap: Spacing.four },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  demo: { marginTop: Spacing.two },
});
