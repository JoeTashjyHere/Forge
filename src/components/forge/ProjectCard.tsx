import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { ProjectHealthBadge } from '@/components/forge/ProjectHealthBadge';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { HealthStatus } from '@/lib/constants';

export interface ProjectCardData {
  id: string;
  title: string;
  description?: string | null;
  stage: string;
  healthStatus?: HealthStatus;
  skillsNeeded?: string[];
  teamCount?: number;
  matchScore?: number;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onPress?: () => void;
  showHealth?: boolean;
}

export function ProjectCard({ project, onPress, showHealth = true }: ProjectCardProps) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} elevated>
      <View style={styles.header}>
        <Text variant="h4" style={{ flex: 1 }} numberOfLines={2}>
          {project.title}
        </Text>
        {typeof project.matchScore === 'number' ? (
          <Badge label={`${project.matchScore}% match`} />
        ) : null}
      </View>

      {project.description ? (
        <Text variant="caption" tone="secondary" numberOfLines={2} style={styles.desc}>
          {project.description}
        </Text>
      ) : null}

      <View style={styles.badges}>
        <BuildStageBadge stage={project.stage} />
        {showHealth && project.healthStatus ? (
          <ProjectHealthBadge status={project.healthStatus} />
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={15} color={theme.textMuted} />
          <Text variant="small" tone="muted">
            {project.teamCount ?? 1} {project.teamCount === 1 ? 'member' : 'members'}
          </Text>
        </View>
        {project.skillsNeeded && project.skillsNeeded.length ? (
          <Text variant="small" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            Needs: {project.skillsNeeded.slice(0, 2).join(', ')}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  desc: { marginTop: Spacing.two },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
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
