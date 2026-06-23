import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { ProjectHealthBadge } from '@/components/forge/ProjectHealthBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { calculateProjectHealth, milestoneProgress } from '@/lib/health';
import { SAMPLE_PROJECTS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const load = useProjectStore((s) => s.load);
  const loaded = useProjectStore((s) => s.loaded);
  const owned = useProjectStore((s) => s.projects.find((p) => p.id === id));

  const loadProject = useWorkspaceStore((s) => s.loadProject);
  const milestones = useWorkspaceStore((s) => s.milestonesByProject[id!] ?? []);
  const tasks = useWorkspaceStore((s) => s.tasksByProject[id!] ?? []);

  useEffect(() => {
    if (!loaded && profile?.id) void load(profile.id);
  }, [loaded, profile?.id, load]);

  const isOwner = !!owned;

  useEffect(() => {
    if (isOwner && id) void loadProject(id);
  }, [isOwner, id, loadProject]);

  const sample = SAMPLE_PROJECTS.find((p) => p.projectId === id);

  const title = owned?.title ?? sample?.title ?? 'Project';
  const description = owned?.description ?? sample?.description ?? '';
  const stage = owned?.stage ?? sample?.stage ?? 'Idea';
  const liveHealth = isOwner
    ? calculateProjectHealth({ milestones, tasks, teamSize: 1 }).status
    : null;
  const health = liveHealth ?? owned?.healthStatus ?? (sample?.healthStatus as any) ?? 'Needs Attention';
  const skills = sample?.skillsNeeded ?? [];
  const progress = milestoneProgress(milestones);
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        {isOwner ? (
          <Pressable onPress={() => router.push(`/projects/${id}/settings`)} hitSlop={12}>
            <Ionicons name="settings-outline" size={22} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </View>

      <Text variant="h1">{title}</Text>
      <View style={styles.badges}>
        <BuildStageBadge stage={stage} />
        <ProjectHealthBadge status={health} />
        {sample?.matchScore ? <Badge label={`${sample.matchScore}% match`} /> : null}
      </View>

      {description ? (
        <Text tone="secondary" style={styles.desc}>
          {description}
        </Text>
      ) : null}

      {skills.length ? (
        <Card padded style={styles.block}>
          <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
            Skills needed
          </Text>
          <View style={styles.chips}>
            {skills.map((s) => (
              <Badge key={s} label={s} variant="outline" />
            ))}
          </View>
        </Card>
      ) : null}

      {isOwner ? (
        <Pressable
          onPress={() => router.push(`/projects/${id}/workspace`)}
          style={styles.block}
        >
          <Card padded>
            <View style={styles.progressHeader}>
              <Text variant="label" tone="secondary">
                Progress
              </Text>
              <Text variant="label" weight="semibold" tone="tint">
                {progress}%
              </Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.tint }]}
              />
            </View>
            <View style={styles.statsRow}>
              <Text variant="caption" tone="secondary">
                {completedMilestones}/{milestones.length} milestones
              </Text>
              <Text variant="caption" tone="secondary">
                {openTasks} open task{openTasks === 1 ? '' : 's'}
              </Text>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        {isOwner ? (
          <>
            <Button
              title="Open workspace"
              onPress={() => router.push(`/projects/${id}/workspace`)}
            />
            <Button
              title="Create AI Roadmap"
              variant="secondary"
              onPress={() => router.push(`/projects/${id}/roadmap`)}
            />
            <Button
              title="Ask the AI coach"
              variant="ghost"
              onPress={() => router.push(`/ai/coach?projectId=${id}`)}
            />
          </>
        ) : (
          <Button title="Request to join" onPress={() => router.push('/(tabs)/matches')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  desc: { marginTop: Spacing.four },
  block: { marginTop: Spacing.five },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actions: { marginTop: Spacing.six, gap: Spacing.three },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 999 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
});
