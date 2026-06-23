import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandHeader } from '@/components/forge/BrandHeader';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const HIGHLIGHTS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'people-outline', label: 'Find collaborators who complement your skills' },
  { icon: 'sparkles-outline', label: 'Get an AI roadmap from idea to launch' },
  { icon: 'rocket-outline', label: 'Build momentum and ship real products' },
];

export default function OnboardingWelcome() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <Button title="Set up my profile" onPress={() => router.push('/onboarding/basic-info')} />
      }
    >
      <View style={styles.top}>
        <BrandHeader
          title="Let's get you building"
          subtitle="Answer a few quick questions so Forge can match you with the right people, projects, and next steps."
        />
      </View>
      <View style={styles.list}>
        {HIGHLIGHTS.map((h) => (
          <View key={h.label} style={styles.row}>
            <View style={[styles.icon, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name={h.icon} size={20} color={theme.tint} />
            </View>
            <Text style={styles.rowText}>{h.label}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', gap: Spacing.six },
  top: { marginTop: Spacing.five },
  list: { gap: Spacing.four, marginBottom: Spacing.six },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
});
