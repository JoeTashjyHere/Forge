import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import type { BuilderArchetype } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import { trackEvent } from '@/lib/analytics';
import { analyzeLaunchReadiness } from '@/lib/launchReadiness';
import { fullName } from '@/lib/profile';
import { analyzeTeam } from '@/lib/teamBuilder';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { ReadinessSeverity, ReadinessStatus } from '@/types/launchReadiness';

const STATUS_META: Record<ReadinessStatus, { label: string; color: string }> = {
  not_ready: { label: 'Not ready', color: '#EF4444' },
  getting_close: { label: 'Getting close', color: '#F59E0B' },
  ready: { label: 'Ready to launch', color: '#10B981' },
};

export default function LaunchReadinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const milestones = useWorkspaceStore((s) => s.milestonesByProject[id!] ?? []);
  const tasks = useWorkspaceStore((s) => s.tasksByProject[id!] ?? []);
  const loadWorkspace = useWorkspaceStore((s) => s.loadProject);

  const members = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const loadMembers = useMembershipStore((s) => s.loadMembers);

  const loadRoadmaps = useRoadmapStore((s) => s.loadProject);
  const latestRoadmap = useRoadmapStore((s) => s.roadmapsByProject[id!]?.[0] ?? null);

  const isOwner = project?.ownerId === profile?.id;

  useEffect(() => {
    if (id) void trackEvent('launch_readiness_viewed', profile?.id ?? null, { projectId: id });
  }, [id, profile?.id]);

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  useEffect(() => {
    if (!id) return;
    void loadWorkspace(id);
    void loadRoadmaps(id);
    const ownerUser =
      isOwner && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
  }, [id, isOwner, profile, loadWorkspace, loadRoadmaps, loadMembers]);

  const analysis = useMemo(() => {
    const activeMembers = members.filter((m) => m.membershipStatus === 'active');
    const teamAnalysis = analyzeTeam({
      project: { stage: project?.stage, skillsNeeded: project?.skillsNeeded },
      members: activeMembers,
      ownerId: project?.ownerId ?? profile?.id,
      ownerArchetype: (profile?.builderArchetype as BuilderArchetype | null) ?? null,
    });
    return analyzeLaunchReadiness(
      {
        description: project?.description ?? null,
        stage: project?.stage ?? 'Idea',
        launchStatus: project?.launchStatus ?? 'draft',
      },
      milestones,
      tasks,
      teamAnalysis,
      latestRoadmap,
    );
  }, [project, members, milestones, tasks, latestRoadmap, profile]);

  const status = STATUS_META[analysis.readinessStatus];
  const severityColor = (s: ReadinessSeverity) =>
    s === 'High' ? theme.danger : s === 'Medium' ? '#F59E0B' : theme.textMuted;

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">Launch Readiness</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Score */}
      <Card padded style={styles.scoreCard}>
        <Text variant="h1" weight="bold" style={{ color: status.color }}>
          {analysis.readinessScore}
          <Text variant="h3" tone="muted">
            /100
          </Text>
        </Text>
        <Badge label={status.label} color={status.color} dot />
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.fill,
              { width: `${analysis.readinessScore}%`, backgroundColor: status.color },
            ]}
          />
        </View>
      </Card>

      {/* Recommended next action */}
      <Card padded style={{ ...styles.nextAction, borderColor: theme.tint }}>
        <Ionicons name="arrow-forward-circle" size={20} color={theme.tint} />
        <View style={{ flex: 1 }}>
          <Text variant="small" tone="muted">
            Recommended next action
          </Text>
          <Text variant="label" weight="semibold">
            {analysis.recommendedNextAction}
          </Text>
        </View>
      </Card>

      {/* Strengths */}
      {analysis.strengths.length ? (
        <View style={styles.section}>
          <SectionHeader title="Strengths" />
          <Card padded>
            <View style={{ gap: Spacing.three }}>
              {analysis.strengths.map((s) => (
                <View key={s} style={styles.lineItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                  <Text variant="caption" style={{ flex: 1 }}>
                    {s}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Gaps */}
      {analysis.missingLaunchItems.length ? (
        <View style={styles.section}>
          <SectionHeader title="Gaps" />
          <Card padded>
            <View style={{ gap: Spacing.three }}>
              {analysis.missingLaunchItems.map((g) => (
                <View key={g.id} style={styles.lineItem}>
                  <Ionicons name="ellipse-outline" size={18} color={theme.textMuted} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="semibold">
                      {g.label}
                    </Text>
                    {g.detail ? (
                      <Text variant="small" tone="muted">
                        {g.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Risks */}
      {analysis.risks.length ? (
        <View style={styles.section}>
          <SectionHeader title="Risks" />
          <Card padded>
            <View style={{ gap: Spacing.three }}>
              {analysis.risks.map((r) => (
                <View key={r.id} style={styles.lineItem}>
                  <Ionicons name="warning-outline" size={18} color={severityColor(r.severity)} />
                  <Text variant="caption" style={{ flex: 1 }}>
                    {r.label}
                  </Text>
                  <Badge label={r.severity} color={severityColor(r.severity)} dot />
                </View>
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Checklist */}
      <View style={styles.section}>
        <SectionHeader title="Launch checklist" />
        <Card padded>
          <View style={{ gap: Spacing.three }}>
            {analysis.checklist.map((c) => (
              <View key={c.id} style={styles.lineItem}>
                <Ionicons
                  name={c.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={c.done ? theme.success : theme.textMuted}
                />
                <Text
                  variant="caption"
                  tone={c.done ? 'default' : 'secondary'}
                  style={{ flex: 1 }}
                >
                  {c.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {isOwner ? (
        <View style={styles.section}>
          <Button
            title="Publish Launch"
            onPress={() => router.push(`/projects/${id}/launch`)}
          />
        </View>
      ) : null}
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
  scoreCard: { alignItems: 'center', gap: Spacing.three },
  track: { height: 8, borderRadius: 999, overflow: 'hidden', alignSelf: 'stretch' },
  fill: { height: 8, borderRadius: 999 },
  nextAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    marginTop: Spacing.four,
  },
  section: { marginTop: Spacing.five },
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
