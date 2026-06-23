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
import { loginSchema, type LoginInput } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      await signIn(values.email, values.password);
      router.replace('/');
    } catch (e: any) {
      setError('password', { message: e.message ?? 'Unable to sign in' });
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <BrandHeader title="Welcome back" subtitle="Build what won't build itself." />

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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />
        <Button title="Sign in" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>

      <View style={styles.footer}>
        <Text tone="secondary">New to Forge? </Text>
        <Link href="/auth/signup">
          <Text tone="tint" weight="semibold">
            Create an account
          </Text>
        </Link>
      </View>

      {!isSupabaseConfigured ? (
        <Text variant="small" tone="muted" center style={styles.demo}>
          Demo mode: Supabase is not configured. Any email and password (8+ chars) will sign you in
          locally.
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
