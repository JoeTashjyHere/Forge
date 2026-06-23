import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useProjectStore } from '@/store/projectStore';

const TOOLS: { icon: keyof typeof Ionicons.glyphMap; label: string; key: string }[] = [
  { icon: 'flag-outline', label: 'Milestones', key: 'milestones' },
  { icon: 'checkbox-outline', label: 'Tasks', key: 'tasks' },
  { icon: 'document-outline', label: 'Files', key: 'files' },
  { icon: 'chatbubble-outline', label: 'Chat', key: 'chat' },
];

export default function Workspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {project?.title ?? 'Workspace'}
        </Text>
      </View>

      <Text variant="h2">Workspace</Text>

      <View style={styles.toolGrid}>
        {TOOLS.map((t) => (
          <Card key={t.key} style={styles.tool} padded>
            <View style={[styles.toolIcon, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name={t.icon} size={20} color={theme.tint} />
            </View>
            <Text variant="label" weight="semibold">
              {t.label}
            </Text>
          </Card>
        ))}
      </View>

      <Pressable
        onPress={() => router.push(`/ai/coach?projectId=${id}`)}
        style={[styles.coach, { backgroundColor: theme.backgroundSelected }]}
      >
        <Ionicons name="sparkles" size={20} color={theme.tint} />
        <View style={{ flex: 1 }}>
          <Text variant="label" weight="semibold">
            Ask the AI Build Coach
          </Text>
          <Text variant="caption" tone="secondary">
            Get a roadmap, next steps, and risk checks.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>

      <View style={styles.section}>
        <SectionHeader title="Milestones" />
        <Card padded>
          <EmptyState
            icon="flag-outline"
            title="No milestones created"
            description="Generate an AI roadmap to break this project into milestones."
            actionLabel="Generate roadmap"
            onAction={() => router.push(`/ai/coach?projectId=${id}`)}
          />
        </Card>
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
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.five,
  },
  tool: { width: '47%', gap: Spacing.three },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    padding: Spacing.four,
    marginTop: Spacing.five,
  },
  section: { marginTop: Spacing.six },
});
