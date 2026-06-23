import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AIRoadmap } from '@/types/ai';

const SEVERITY_COLOR: Record<string, string> = {
  high: Brand.danger,
  medium: Brand.warning,
  low: Brand.success,
};

export function RoadmapView({ roadmap }: { roadmap: AIRoadmap }) {
  const theme = useTheme();
  const allMilestones = roadmap.weeks.flatMap((w) => w.milestones);
  const allTasks = roadmap.weeks.flatMap((w) => w.tasks);

  return (
    <View style={{ gap: Spacing.five }}>
      <Card padded elevated>
        <View style={styles.summaryHead}>
          <Ionicons name="sparkles" size={18} color={theme.tint} />
          <Text variant="label" weight="semibold" tone="tint">
            30-Day Roadmap
          </Text>
          {roadmap.stage ? <Badge label={roadmap.stage} variant="outline" /> : null}
        </View>
        <Text tone="secondary" style={{ marginTop: Spacing.three }}>
          {roadmap.summary}
        </Text>
      </Card>

      {roadmap.next_action ? (
        <Card padded style={{ backgroundColor: theme.backgroundSelected }}>
          <Text variant="small" tone="tint" weight="semibold">
            NEXT ACTION
          </Text>
          <Text style={{ marginTop: 4 }}>{roadmap.next_action}</Text>
        </Card>
      ) : null}

      {roadmap.recommended_team.length ? (
        <View>
          <SectionHeader title="Recommended team" />
          <View style={styles.list}>
            {roadmap.recommended_team.map((member, i) => (
              <Card key={`${member.role}-${i}`} padded>
                <Text variant="label" weight="semibold">
                  {member.role}
                </Text>
                <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                  {member.reason}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {roadmap.risks.length ? (
        <View>
          <SectionHeader title="Risks to watch" />
          <View style={styles.list}>
            {roadmap.risks.map((r, i) => (
              <Card key={`${r.risk}-${i}`} padded>
                <View style={styles.riskHead}>
                  <Text variant="label" weight="semibold" style={{ flex: 1 }}>
                    {r.risk}
                  </Text>
                  <Badge
                    label={r.severity.toUpperCase()}
                    color={SEVERITY_COLOR[r.severity] ?? theme.textMuted}
                  />
                </View>
                <Text variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                  {r.mitigation}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {roadmap.weeks.length ? (
        <View>
          <SectionHeader title="Weekly plan" />
          <View style={styles.list}>
            {roadmap.weeks.map((w) => (
              <Card key={w.week} padded>
                <View style={styles.weekHead}>
                  <View style={[styles.weekBadge, { backgroundColor: theme.tint }]}>
                    <Text variant="small" weight="bold" style={{ color: theme.textInverse }}>
                      W{w.week}
                    </Text>
                  </View>
                  <Text variant="label" weight="semibold" style={{ flex: 1 }}>
                    {w.goal}
                  </Text>
                </View>
                {w.milestones.length ? (
                  <View style={styles.group}>
                    <Text variant="small" tone="muted" weight="semibold">
                      MILESTONES
                    </Text>
                    {w.milestones.map((m, i) => (
                      <Bullet key={i} icon="flag-outline" text={m} />
                    ))}
                  </View>
                ) : null}
                {w.tasks.length ? (
                  <View style={styles.group}>
                    <Text variant="small" tone="muted" weight="semibold">
                      TASKS
                    </Text>
                    {w.tasks.map((t, i) => (
                      <Bullet key={i} icon="checkbox-outline" text={t} />
                    ))}
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.countsRow}>
        <Card padded style={{ flex: 1 }}>
          <Text variant="h3" tone="tint">
            {allMilestones.length}
          </Text>
          <Text variant="caption" tone="secondary">
            Milestones
          </Text>
        </Card>
        <Card padded style={{ flex: 1 }}>
          <Text variant="h3" tone="tint">
            {allTasks.length}
          </Text>
          <Text variant="caption" tone="secondary">
            Tasks
          </Text>
        </Card>
      </View>
    </View>
  );
}

function Bullet({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.bullet}>
      <Ionicons name={icon} size={14} color={theme.textMuted} style={{ marginTop: 3 }} />
      <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  list: { gap: Spacing.three },
  riskHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  weekHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  weekBadge: {
    width: 32,
    height: 24,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: { marginTop: Spacing.three, gap: Spacing.one },
  bullet: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  countsRow: { flexDirection: 'row', gap: Spacing.three },
});
