import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LegalSection {
  heading: string;
  body: string;
}

interface LegalScreenProps {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export function LegalScreen({ title, updated, sections }: LegalScreenProps) {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </Text>
      </View>

      <Text variant="h2" weight="bold">
        {title}
      </Text>
      <Text variant="small" tone="muted" style={styles.updated}>
        {updated}
      </Text>

      <View style={styles.sections}>
        {sections.map((s) => (
          <View key={s.heading} style={styles.section}>
            <Text weight="semibold">{s.heading}</Text>
            <Text variant="caption" tone="secondary">
              {s.body}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  updated: { marginTop: Spacing.one },
  sections: { gap: Spacing.five, marginTop: Spacing.five },
  section: { gap: Spacing.two },
});
