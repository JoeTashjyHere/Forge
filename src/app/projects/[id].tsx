import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { BuilderCard } from '@/components/forge/BuilderCard';
import { MemberRow } from '@/components/forge/MemberRow';
import { ProjectHealthBadge } from '@/components/forge/ProjectHealthBadge';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import type { BuilderArchetype } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import { calculateProjectHealth, milestoneProgress } from '@/lib/health';
import { analyzeLaunchReadiness } from '@/lib/launchReadiness';
import { canManageMembers } from '@/lib/permissions';
import { fullName } from '@/lib/profile';
import { recommendTeammates } from '@/lib/recommend';
import { SAMPLE_PROJECTS } from '@/lib/sampleData';
import { analyzeTeam } from '@/lib/teamBuilder';
import { useAuthStore } from '@/store/authStore';
import { useLaunchStore } from '@/store/launchStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';
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

  const loadRoadmaps = useRoadmapStore((s) => s.loadProject);
  const latestRoadmap = useRoadmapStore((s) => s.roadmapsByProject[id!]?.[0] ?? null);

  const launch = useLaunchStore((s) => s.byProject[id!]);
  const loadProjectLaunch = useLaunchStore((s) => s.loadProjectLaunch);

  const members = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const requestToJoin = useMembershipStore((s) => s.requestToJoin);
  const acceptInvite = useMembershipStore((s) => s.acceptInvite);
  const declineInvite = useMembershipStore((s) => s.declineInvite);

  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!loaded && profile?.id) void load(profile.id);
  }, [loaded, profile?.id, load]);

  const isOwner = !!owned;

  useEffect(() => {
    if (isOwner && id) {
      void loadProject(id);
      void loadRoadmaps(id);
      void loadProjectLaunch(id);
    }
  }, [isOwner, id, loadProject, loadRoadmaps, loadProjectLaunch]);

  useEffect(() => {
    if (!id) return;
    const ownerUser =
      isOwner && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
  }, [id, isOwner, profile, loadMembers]);

  const sample = SAMPLE_PROJECTS.find((p) => p.projectId === id);

  const title = owned?.title ?? sample?.title ?? 'Project';
  const description = owned?.description ?? sample?.description ?? '';
  const stage = owned?.stage ?? sample?.stage ?? 'Idea';
  const skills = useMemo(
    () => owned?.skillsNeeded ?? sample?.skillsNeeded ?? [],
    [owned?.skillsNeeded, sample?.skillsNeeded],
  );

  const activeMembers = members.filter((m) => m.membershipStatus === 'active');
  const teamSize = Math.max(activeMembers.length, 1);

  const liveHealth = isOwner
    ? calculateProjectHealth({ milestones, tasks, teamSize }).status
    : null;
  const health = liveHealth ?? owned?.healthStatus ?? (sample?.healthStatus as any) ?? 'Needs Attention';
  const progress = milestoneProgress(milestones);
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;

  const myMembership = members.find((m) => m.userId === profile?.id);
  const canManage = owned && profile ? canManageMembers(owned, profile.id, members) : false;

  const { recommendations, missingSkills } = useMemo(
    () => recommendTeammates({ stage, skillsNeeded: skills }, activeMembers),
    [stage, skills, activeMembers],
  );

  const readiness = useMemo(() => {
    if (!isOwner || !owned) return null;
    const teamAnalysis = analyzeTeam({
      project: { stage: owned.stage, skillsNeeded: owned.skillsNeeded },
      members: activeMembers,
      ownerId: owned.ownerId,
      ownerArchetype: (profile?.builderArchetype as BuilderArchetype | null) ?? null,
    });
    return analyzeLaunchReadiness(owned, milestones, tasks, teamAnalysis, latestRoadmap);
  }, [isOwner, owned, activeMembers, milestones, tasks, latestRoadmap, profile]);

  const request = async () => {
    if (!id || !profile || working) return;
    setWorking(true);
    try {
      await requestToJoin(id, {
        id: profile.id,
        name: fullName(profile),
        photoUrl: profile.profilePhotoUrl,
      });
    } finally {
      setWorking(false);
    }
  };

  const respondInvite = async (accept: boolean) => {
    if (!id || !myMembership || working) return;
    setWorking(true);
    try {
      if (accept) await acceptInvite(id, myMembership.id);
      else await declineInvite(id, myMembership.id);
    } finally {
      setWorking(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        {canManage ? (
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
        <Pressable onPress={() => router.push(`/projects/${id}/workspace`)} style={styles.block}>
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
              <View style={[styles.fill, { width: `${progress}%`, backgroundColor: theme.tint }]} />
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

      {/* Launch readiness banner */}
      {isOwner && readiness ? (
        <Pressable
          onPress={() => router.push(`/projects/${id}/launch-readiness`)}
          style={styles.block}
        >
          <Card padded>
            <View style={styles.readinessRow}>
              <Ionicons
                name="rocket-outline"
                size={20}
                color={readiness.readinessStatus === 'ready' ? theme.success : theme.tint}
              />
              <View style={{ flex: 1 }}>
                <Text variant="label" weight="semibold">
                  Launch readiness · {readiness.readinessScore}/100
                </Text>
                <Text variant="caption" tone="secondary">
                  {readiness.readinessStatus === 'ready'
                    ? 'This project may be ready for launch.'
                    : readiness.readinessStatus === 'not_ready'
                      ? 'Launch readiness is low — review what is missing before publishing.'
                      : 'Getting close — keep closing the remaining gaps.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </View>
          </Card>
        </Pressable>
      ) : null}

      {/* Launch status */}
      {isOwner ? (
        <Pressable
          onPress={() =>
            launch?.status === 'published'
              ? router.push(`/marketplace/${launch.id}`)
              : router.push(`/projects/${id}/launch`)
          }
          style={styles.block}
        >
          <Card padded>
            <View style={styles.readinessRow}>
              <Ionicons
                name={launch?.status === 'published' ? 'rocket' : 'rocket-outline'}
                size={20}
                color={launch?.status === 'published' ? theme.success : theme.textMuted}
              />
              <View style={{ flex: 1 }}>
                <Text variant="label" weight="semibold">
                  {launch?.status === 'published'
                    ? 'Published'
                    : launch?.status === 'draft'
                      ? 'Draft launch'
                      : 'Not launched'}
                </Text>
                <Text variant="caption" tone="secondary">
                  {launch?.status === 'published'
                    ? 'View your public launch page.'
                    : launch?.status === 'draft'
                      ? 'Finish and publish your launch.'
                      : 'Publish a launch page to showcase what you built.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </View>
          </Card>
        </Pressable>
      ) : null}

      {/* Team */}
      {activeMembers.length ? (
        <View style={styles.block}>
          <SectionHeader
            title={`Team (${activeMembers.length})`}
            actionLabel={canManage ? 'Manage' : undefined}
            onAction={canManage ? () => router.push(`/projects/${id}/settings`) : undefined}
          />
          <Card padded>
            <View style={{ gap: Spacing.three }}>
              {activeMembers.slice(0, 4).map((m) => (
                <MemberRow key={m.id} member={m} hideStatus isYou={m.userId === profile?.id} />
              ))}
            </View>
          </Card>
        </View>
      ) : null}

      {/* Recommended teammates (owner) */}
      {isOwner && recommendations.length ? (
        <View style={styles.block}>
          <SectionHeader title="Recommended teammates" />
          {missingSkills.length ? (
            <Text variant="caption" tone="secondary" style={{ marginBottom: Spacing.three }}>
              Still needs: {missingSkills.join(', ')}
            </Text>
          ) : null}
          <View style={{ gap: Spacing.three }}>
            {recommendations.slice(0, 3).map((b) => (
              <BuilderCard
                key={b.userId}
                builder={b}
                onPress={() => router.push(`/matches/${b.userId}`)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {isOwner ? (
          <>
            <Button title="Open workspace" onPress={() => router.push(`/projects/${id}/workspace`)} />
            <Button
              title="AI Team Builder"
              variant="secondary"
              onPress={() => router.push(`/projects/${id}/team-builder`)}
            />
            <Button
              title="Launch Readiness"
              variant="secondary"
              onPress={() => router.push(`/projects/${id}/launch-readiness`)}
            />
            <Button
              title={launch ? 'Edit launch' : 'Publish Launch'}
              variant="secondary"
              onPress={() => router.push(`/projects/${id}/launch`)}
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
        ) : myMembership?.membershipStatus === 'active' ? (
          <Button title="Open workspace" onPress={() => router.push(`/projects/${id}/workspace`)} />
        ) : myMembership?.membershipStatus === 'invited' ? (
          <>
            <Button title="Accept invitation" loading={working} onPress={() => respondInvite(true)} />
            <Button
              title="Decline"
              variant="ghost"
              onPress={() => respondInvite(false)}
            />
          </>
        ) : myMembership?.membershipStatus === 'pending' ? (
          <Button title="Request pending" variant="secondary" disabled onPress={() => {}} />
        ) : myMembership?.membershipStatus === 'declined' ? (
          <Button title="Request declined" variant="ghost" disabled onPress={() => {}} />
        ) : (
          <Button title="Request to join" loading={working} onPress={request} />
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
  readinessRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
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
