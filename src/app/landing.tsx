import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ModeBanner } from '@/components/forge/ModeBanner';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

const VALUE_PROPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'sparkles-outline',
    title: 'AI that plans the work',
    body: 'Turn an idea into a 30-day roadmap with milestones and tasks you can actually ship.',
  },
  {
    icon: 'people-outline',
    title: 'Find the right teammates',
    body: 'Get matched with builders who fill your real gaps — design, growth, engineering.',
  },
  {
    icon: 'rocket-outline',
    title: 'Launch and be seen',
    body: 'Track launch readiness and publish to the marketplace when you’re ready to ship.',
  },
];

export default function Landing() {
  const router = useRouter();
  const theme = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const [exploring, setExploring] = useState(false);

  const exploreDemo = async () => {
    if (exploring) return;
    setExploring(true);
    try {
      await signIn('demo@forge.build', 'forgedemo123');
      router.replace('/');
    } finally {
      setExploring(false);
    }
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <View style={styles.mark}>
            <Ionicons name="hammer" size={22} color="#FFFFFF" />
          </View>
          <Text variant="h3" weight="bold">
            Forge
          </Text>
        </View>

        <Text variant="h1" weight="bold" style={styles.tagline}>
          Build What Won’t Build Itself
        </Text>
        <Text variant="body" tone="secondary" style={styles.pitch}>
          Forge helps ambitious people turn ideas into real projects — with an AI coach, the right
          teammates, and a clear path from first step to launch.
        </Text>
        <View style={styles.modeRow}>
          <ModeBanner demoOnly />
        </View>
      </View>

      <View style={styles.valueProps}>
        {VALUE_PROPS.map((v) => (
          <View key={v.title} style={[styles.valueRow, { borderColor: theme.border }]}>
            <View style={[styles.valueIcon, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name={v.icon} size={20} color={theme.tint} />
            </View>
            <View style={styles.valueText}>
              <Text weight="semibold">{v.title}</Text>
              <Text variant="small" tone="secondary">
                {v.body}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Start Building" size="lg" onPress={() => router.push('/auth/signup')} />
        {!isSupabaseConfigured ? (
          <Button
            title="Explore the demo"
            variant="secondary"
            size="lg"
            loading={exploring}
            onPress={exploreDemo}
          />
        ) : null}
        <View style={styles.signInRow}>
          <Text tone="secondary">Already building? </Text>
          <Text tone="tint" weight="semibold" onPress={() => router.push('/auth/login')}>
            Sign in
          </Text>
        </View>
      </View>

      <Text variant="small" tone="muted" center style={styles.legal}>
        By continuing you agree to our{' '}
        <Text variant="small" tone="tint" onPress={() => router.push('/legal/terms')}>
          Terms
        </Text>{' '}
        and{' '}
        <Text variant="small" tone="tint" onPress={() => router.push('/legal/privacy')}>
          Privacy Policy
        </Text>
        .
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'center', gap: Spacing.six, paddingVertical: Spacing.six },
  hero: { gap: Spacing.three },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mark: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
    backgroundColor: Brand.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: { marginTop: Spacing.four },
  pitch: { marginTop: Spacing.one },
  modeRow: { flexDirection: 'row', marginTop: Spacing.two },
  valueProps: { gap: Spacing.three },
  valueRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  valueIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: { flex: 1, gap: 2 },
  actions: { gap: Spacing.three },
  signInRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  legal: { marginTop: Spacing.two },
});
