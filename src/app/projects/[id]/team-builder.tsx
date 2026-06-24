import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import type { BuilderArchetype } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import { canManageMembers } from '@/lib/permissions';
import { fullName } from '@/lib/profile';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import { analyzeTeam, fetchCandidateBuilders } from '@/lib/teamBuilder';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { BuilderMatch } from '@/types/matching';
import type { Priority, RecommendedBuilder } from '@/types/teamBuilder';

export default function TeamBuilderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const members = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const inviteBuilder = useMembershipStore((s) => s.inviteBuilder);

  const loadWorkspace = useWorkspaceStore((s) => s.loadProject);

  const [candidates, setCandidates] = useState<BuilderMatch[] | null>(null);
  const [invited, setInvited] = useState<Record<string, boolean>>({});

  const isOwner = project?.ownerId === profile?.id;
  const canManage = project && profile ? canManageMembers(project, profile.id, members) : false;

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  useEffect(() => {
    if (!id) return;
    const ownerUser =
      isOwner && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
    void loadWorkspace(id);
  }, [id, isOwner, profile, loadMembers, loadWorkspace]);

  useEffect(() => {
    let alive = true;
    void fetchCandidateBuilders().then((c) => {
      if (alive) setCandidates(c);
    });
    return () => {
      alive = false;
    };
  }, []);

  const activeMembers = useMemo(
    () => members.filter((m) => m.membershipStatus === 'active'),
    [members],
  );

  const analysis = useMemo(
    () =>
      analyzeTeam({
        project: {
          description: project?.description,
          stage: project?.stage,
          skillsNeeded: project?.skillsNeeded,
        },
        members: activeMembers,
        ownerId: project?.ownerId ?? profile?.id,
        ownerArchetype: (profile?.builderArchetype as BuilderArchetype | null) ?? null,
        candidates: candidates ?? SAMPLE_BUILDERS,
        excludeUserIds: members.map((m) => m.userId),
      }),
    [project, activeMembers, members, candidates, profile],
  );

  const priorityColor = (p: Priority) =>
    p === 'High' ? theme.danger : p === 'Medium' ? '#F59E0B' : theme.textMuted;

  const invite = async (b: RecommendedBuilder) => {
    if (!id || invited[b.userId]) return;
    await inviteBuilder(
      id,
      { id: b.userId, name: b.displayName, photoUrl: b.profilePhotoUrl },
      'Contributor',
    );
    setInvited((prev) => ({ ...prev, [b.userId]: true }));
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">Team Builder</Text>
        <View style={{ width: 26 }} />
      </View>

      {candidates === null ? (
        <LoadingState label="Analyzing your team…" />
      ) : (
        <>
          {/* Team overview */}
          <Card padded style={styles.overview}>
            <Text variant="label" tone="secondary">
              {project?.title ?? 'Project'} · {project?.stage ?? 'Idea'} stage
            </Text>
            <View style={styles.statRow}>
              <Stat label="Team" value={analysis.currentTeam.length} theme={theme} />
              <Stat
                label="Missing skills"
                value={analysis.missingSkills.length}
                theme={theme}
                accent={analysis.missingSkills.length ? '#F59E0B' : undefined}
              />
              <Stat
                label="Missing roles"
                value={analysis.missingRoles.length}
                theme={theme}
                accent={analysis.criticalRoleCount ? theme.danger : undefined}
              />
            </View>
            {analysis.recommendedNextRole ? (
              <View style={[styles.nextRole, { borderColor: theme.border }]}>
                <Ionicons name="sparkles" size={16} color={theme.tint} />
                <Text variant="caption" style={{ flex: 1 }}>
                  Recommended next role:{' '}
                  <Text variant="caption" weight="semibold" tone="tint">
                    {analysis.recommendedNextRole.role}
                  </Text>
                </Text>
                <Badge
                  label={analysis.recommendedNextRole.priority}
                  color={priorityColor(analysis.recommendedNextRole.priority)}
                  dot
                />
              </View>
            ) : null}
          </Card>

          {/* Current team */}
          <View style={styles.section}>
            <SectionHeader title={`Current team (${analysis.currentTeam.length})`} />
            <Card padded>
              {analysis.currentTeam.length ? (
                <View style={{ gap: Spacing.three }}>
                  {analysis.currentTeam.map((m) => (
                    <View key={m.userId} style={styles.memberRow}>
                      <Avatar name={m.name} uri={m.photoUrl} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text variant="label" weight="semibold" numberOfLines={1}>
                          {m.name}
                          {m.isYou ? ' (You)' : ''}
                        </Text>
                        <Text variant="small" tone="muted">
                          {m.role}
                        </Text>
                      </View>
                      {m.archetype ? <Badge label={m.archetype} variant="outline" /> : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text tone="secondary">No active members yet.</Text>
              )}
            </Card>
          </View>

          {/* Missing skills */}
          <View style={styles.section}>
            <SectionHeader title="Missing skills" />
            <Card padded>
              {analysis.missingSkills.length ? (
                <View style={styles.chips}>
                  {analysis.missingSkills.map((s) => (
                    <Badge
                      key={s.skill}
                      label={s.skill}
                      color={priorityColor(s.priority)}
                      dot
                    />
                  ))}
                </View>
              ) : (
                <Text tone="secondary">Your team covers the skills this stage needs.</Text>
              )}
            </Card>
          </View>

          {/* Missing roles */}
          <View style={styles.section}>
            <SectionHeader title="Missing roles" />
            <Card padded>
              {analysis.missingRoles.length ? (
                <View style={{ gap: Spacing.three }}>
                  {analysis.missingRoles.map((r) => (
                    <View key={r.role} style={styles.lineItem}>
                      <View style={{ flex: 1 }}>
                        <Text variant="label" weight="semibold">
                          {r.role}
                        </Text>
                        <Text variant="small" tone="muted">
                          {r.reason}
                        </Text>
                      </View>
                      <Badge label={r.priority} color={priorityColor(r.priority)} dot />
                    </View>
                  ))}
                </View>
              ) : (
                <Text tone="secondary">All key roles for this stage are covered.</Text>
              )}
            </Card>
          </View>

          {/* Risk factors */}
          <View style={styles.section}>
            <SectionHeader title="Risk factors" />
            <Card padded>
              {analysis.risks.length ? (
                <View style={{ gap: Spacing.three }}>
                  {analysis.risks.map((r) => (
                    <View key={r.id} style={styles.lineItem}>
                      <Ionicons
                        name="warning-outline"
                        size={18}
                        color={priorityColor(r.severity)}
                      />
                      <Text variant="caption" style={{ flex: 1 }}>
                        {r.label}
                      </Text>
                      <Badge label={r.severity} color={priorityColor(r.severity)} dot />
                    </View>
                  ))}
                </View>
              ) : (
                <Text tone="secondary">No major execution risks detected.</Text>
              )}
            </Card>
          </View>

          {/* Recommended builders */}
          <View style={styles.section}>
            <SectionHeader title="Recommended teammates" />
            {analysis.recommendations.length ? (
              <View style={{ gap: Spacing.three }}>
                {analysis.recommendations.map((b) => (
                  <Card key={b.userId} padded>
                    <Pressable
                      style={styles.recHeader}
                      onPress={() => router.push(`/matches/${b.userId}`)}
                    >
                      <Avatar name={b.displayName} uri={b.profilePhotoUrl} size={44} />
                      <View style={{ flex: 1 }}>
                        <Text variant="label" weight="semibold" numberOfLines={1}>
                          {b.displayName}
                        </Text>
                        <Text variant="small" tone="muted" numberOfLines={1}>
                          {b.occupation ?? b.archetype ?? 'Builder'}
                        </Text>
                      </View>
                      <Text variant="label" weight="bold" tone="tint">
                        {b.matchScore}%
                      </Text>
                    </Pressable>
                    <View style={[styles.reasonBox, { backgroundColor: theme.backgroundElement }]}>
                      <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                      <Text variant="caption" style={{ flex: 1 }}>
                        {b.reason}
                      </Text>
                    </View>
                    {canManage ? (
                      <Button
                        title={invited[b.userId] ? 'Invited' : 'Invite to project'}
                        size="sm"
                        variant={invited[b.userId] ? 'secondary' : 'primary'}
                        disabled={invited[b.userId]}
                        onPress={() => invite(b)}
                        style={{ marginTop: Spacing.three }}
                      />
                    ) : null}
                  </Card>
                ))}
              </View>
            ) : (
              <Card padded>
                <EmptyState
                  icon="people-outline"
                  title="No recommendations yet"
                  description="Your team already covers the gaps for this stage, or no matching builders are available."
                />
              </Card>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({
  label,
  value,
  theme,
  accent,
}: {
  label: string;
  value: number;
  theme: ReturnType<typeof useTheme>;
  accent?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text variant="h2" weight="bold" style={{ color: accent ?? theme.text }}>
        {value}
      </Text>
      <Text variant="small" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  overview: { gap: Spacing.three },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.two },
  stat: { alignItems: 'center', flex: 1 },
  nextRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  section: { marginTop: Spacing.five },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  lineItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.small,
    marginTop: Spacing.three,
  },
});
