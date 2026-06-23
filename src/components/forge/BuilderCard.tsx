import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { BuilderMatch } from '@/types/matching';

interface BuilderCardProps {
  builder: BuilderMatch;
  onPress?: () => void;
}

export function BuilderCard({ builder, onPress }: BuilderCardProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} elevated>
      <View style={styles.header}>
        <Avatar name={builder.displayName} uri={builder.profilePhotoUrl} size={48} />
        <View style={styles.headerText}>
          <Text variant="label" weight="semibold" numberOfLines={1}>
            {builder.displayName}
          </Text>
          {builder.occupation ? (
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              {builder.occupation}
            </Text>
          ) : null}
        </View>
        <View style={styles.matchPct}>
          <Text variant="h4" tone="tint" weight="bold">
            {builder.matchScore}%
          </Text>
          <Text variant="small" tone="muted">
            match
          </Text>
        </View>
      </View>

      <View style={styles.badges}>
        {builder.archetype ? <Badge label={builder.archetype} /> : null}
        <BuildStageBadge stage={builder.buildStage} />
      </View>

      {builder.skills.length ? (
        <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.skills}>
          {builder.skills.slice(0, 4).join(' · ')}
        </Text>
      ) : null}

      {builder.reasons.length ? (
        <View style={[styles.reasons, { borderTopColor: theme.border }]}>
          {builder.reasons.slice(0, 3).map((r) => (
            <Text key={r} variant="caption" tone="secondary">
              • {r}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerText: { flex: 1, gap: 2 },
  matchPct: { alignItems: 'flex-end' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  skills: { marginTop: Spacing.three },
  reasons: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
});
