import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MILESTONE_STATUSES } from '@/lib/constants';
import { formatDueDate, isOverdue } from '@/lib/dates';
import type { Milestone } from '@/types/project';

interface MilestoneCardProps {
  milestone: Milestone;
  onPress: () => void;
  onToggleComplete: () => void;
}

export function MilestoneCard({ milestone, onPress, onToggleComplete }: MilestoneCardProps) {
  const theme = useTheme();
  const statusMeta = MILESTONE_STATUSES.find((s) => s.key === milestone.status)!;
  const completed = milestone.status === 'completed';
  const pct = completed ? 100 : milestone.completionPercentage;
  const overdue = !completed && isOverdue(milestone.dueDate);

  return (
    <Card onPress={onPress} elevated>
      <View style={styles.header}>
        <Pressable onPress={onToggleComplete} hitSlop={8} style={styles.check}>
          <Ionicons
            name={completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={completed ? theme.success : theme.borderStrong}
          />
        </Pressable>
        <Text
          variant="label"
          weight="semibold"
          style={[styles.title, completed && styles.struck]}
          numberOfLines={2}
        >
          {milestone.title}
        </Text>
      </View>

      {milestone.description ? (
        <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.desc}>
          {milestone.description}
        </Text>
      ) : null}

      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: statusMeta.color }]} />
      </View>

      <View style={styles.footer}>
        <Badge label={statusMeta.label} color={statusMeta.color} dot />
        <Text variant="small" tone="muted">
          {pct}%
        </Text>
        {milestone.dueDate ? (
          <View style={styles.due}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={overdue ? theme.danger : theme.textMuted}
            />
            <Text variant="small" tone={overdue ? 'danger' : 'muted'}>
              {formatDueDate(milestone.dueDate)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  check: {},
  title: { flex: 1 },
  struck: { textDecorationLine: 'line-through', opacity: 0.6 },
  desc: { marginTop: Spacing.two },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden', marginTop: Spacing.three },
  fill: { height: 6, borderRadius: Radius.pill },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  due: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginLeft: 'auto' },
});
