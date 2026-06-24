import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { formatDueDate } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import type { LaunchListItem } from '@/types/launch';

interface LaunchCardProps {
  launch: LaunchListItem;
  followerCount: number;
  onPress?: () => void;
}

export function LaunchCard({ launch, followerCount, onPress }: LaunchCardProps) {
  const theme = useTheme();
  const date = launch.launchDate ?? launch.createdAt;
  return (
    <Card onPress={onPress} elevated>
      <View style={styles.header}>
        <Text variant="h4" style={{ flex: 1 }} numberOfLines={2}>
          {launch.launchTitle}
        </Text>
        {launch.status === 'draft' ? <Badge label="Draft" color={theme.textMuted} dot /> : null}
      </View>

      {launch.launchDescription ? (
        <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.desc}>
          {launch.launchDescription}
        </Text>
      ) : null}

      <View style={styles.badges}>
        {launch.projectStage ? <BuildStageBadge stage={launch.projectStage} /> : null}
        {launch.projectTitle ? (
          <Text variant="small" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
            {launch.projectTitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={15} color={theme.textMuted} />
          <Text variant="small" tone="muted">
            {launch.teamCount} {launch.teamCount === 1 ? 'builder' : 'builders'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-circle-outline" size={15} color={theme.textMuted} />
          <Text variant="small" tone="muted">
            {followerCount} following
          </Text>
        </View>
        {date ? (
          <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
            <Ionicons name="calendar-outline" size={15} color={theme.textMuted} />
            <Text variant="small" tone="muted">
              {formatDueDate(date)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  desc: { marginTop: Spacing.two },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
