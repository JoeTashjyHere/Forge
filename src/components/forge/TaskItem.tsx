import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';
import { formatDueDate, isOverdue } from '@/lib/dates';
import type { Task } from '@/types/project';

interface TaskItemProps {
  task: Task;
  assigneeName?: string | null;
  onPress: () => void;
  onToggleDone: () => void;
}

export function TaskItem({ task, assigneeName, onPress, onToggleDone }: TaskItemProps) {
  const theme = useTheme();
  const done = task.status === 'done';
  const priorityMeta = TASK_PRIORITIES.find((p) => p.key === task.priority)!;
  const statusMeta = TASK_STATUSES.find((s) => s.key === task.status)!;
  const overdue = !done && isOverdue(task.dueDate);

  return (
    <Card onPress={onPress} padded={false}>
      <View style={styles.row}>
        <Pressable onPress={onToggleDone} hitSlop={8}>
          <Ionicons
            name={done ? 'checkbox' : 'square-outline'}
            size={22}
            color={done ? theme.success : theme.borderStrong}
          />
        </Pressable>
        <View style={styles.body}>
          <Text style={[styles.title, done && styles.struck]} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={styles.meta}>
            {task.status !== 'todo' && task.status !== 'done' ? (
              <Badge label={statusMeta.label} color={statusMeta.color} dot />
            ) : null}
            <Badge label={priorityMeta.label} color={priorityMeta.color} variant="outline" />
            {task.dueDate ? (
              <Text variant="small" tone={overdue ? 'danger' : 'muted'}>
                {formatDueDate(task.dueDate)}
              </Text>
            ) : null}
          </View>
        </View>
        {task.assignedUserId ? <Avatar name={assigneeName ?? 'Member'} size={28} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  body: { flex: 1, gap: Spacing.one },
  title: {},
  struck: { textDecorationLine: 'line-through', opacity: 0.6 },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
});
