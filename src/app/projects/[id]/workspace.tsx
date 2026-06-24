import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MilestoneCard } from '@/components/forge/MilestoneCard';
import { MilestoneFormSheet } from '@/components/forge/MilestoneFormSheet';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { TaskFormSheet, type AssignableMember } from '@/components/forge/TaskFormSheet';
import { TaskItem } from '@/components/forge/TaskItem';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProjectHealthBadge } from '@/components/forge/ProjectHealthBadge';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/dates';
import { calculateProjectHealth, milestoneProgress } from '@/lib/health';
import { fullName } from '@/lib/profile';
import { importRoadmapToWorkspace } from '@/lib/roadmap';
import { MemberRow } from '@/components/forge/MemberRow';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useMessagingStore } from '@/store/messagingStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { Milestone, MilestoneInput, Task, TaskInput } from '@/types/project';

export default function Workspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const loadProject = useWorkspaceStore((s) => s.loadProject);
  const loaded = useWorkspaceStore((s) => !!s.loadedProjects[id!]);
  const milestones = useWorkspaceStore((s) => s.milestonesByProject[id!] ?? []);
  const tasks = useWorkspaceStore((s) => s.tasksByProject[id!] ?? []);
  const createMilestone = useWorkspaceStore((s) => s.createMilestone);
  const updateMilestone = useWorkspaceStore((s) => s.updateMilestone);
  const deleteMilestone = useWorkspaceStore((s) => s.deleteMilestone);
  const createTask = useWorkspaceStore((s) => s.createTask);
  const updateTask = useWorkspaceStore((s) => s.updateTask);
  const deleteTask = useWorkspaceStore((s) => s.deleteTask);

  const [milestoneSheet, setMilestoneSheet] = useState<{ open: boolean; editing: Milestone | null }>({
    open: false,
    editing: null,
  });
  const [taskSheet, setTaskSheet] = useState<{ open: boolean; editing: Task | null }>({
    open: false,
    editing: null,
  });
  const [saving, setSaving] = useState(false);

  const loadRoadmaps = useRoadmapStore((s) => s.loadProject);
  const markImported = useRoadmapStore((s) => s.markImported);
  const latestRoadmap = useRoadmapStore((s) => s.roadmapsByProject[id!]?.[0]);
  const importedIds = useRoadmapStore((s) => s.importedIds);
  const roadmapImported = latestRoadmap ? !!importedIds[latestRoadmap.id] : false;
  const [importingRoadmap, setImportingRoadmap] = useState(false);

  const loadWorkspaceMessages = useMessagingStore((s) => s.loadWorkspaceMessages);
  const workspaceMessages = useMessagingStore((s) => s.workspaceByProject[id!] ?? []);
  const lastMessage = workspaceMessages[workspaceMessages.length - 1];

  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const projectMembers = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const activeMembers = projectMembers.filter((m) => m.membershipStatus === 'active');
  const isOwner = project?.ownerId === profile?.id;

  useEffect(() => {
    if (id) {
      void loadProject(id);
      void loadRoadmaps(id);
      void loadWorkspaceMessages(id);
    }
  }, [id, loadProject, loadRoadmaps, loadWorkspaceMessages]);

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
  }, [id, isOwner, profile, loadMembers]);

  const members: AssignableMember[] = useMemo(
    () => activeMembers.map((m) => ({ id: m.userId, name: m.displayName ?? 'Builder' })),
    [activeMembers],
  );
  const memberName = (uid: string | null) =>
    members.find((m) => m.id === uid)?.name ?? null;

  const health = useMemo(
    () => calculateProjectHealth({ milestones, tasks, teamSize: 1 }),
    [milestones, tasks],
  );
  const progress = milestoneProgress(milestones);

  // --- handlers ----------------------------------------------------------
  const submitMilestone = async (input: MilestoneInput) => {
    setSaving(true);
    try {
      if (milestoneSheet.editing) {
        await updateMilestone(id!, milestoneSheet.editing.id, input);
      } else {
        await createMilestone(id!, input);
      }
      setMilestoneSheet({ open: false, editing: null });
    } finally {
      setSaving(false);
    }
  };

  const submitTask = async (input: TaskInput) => {
    setSaving(true);
    try {
      if (taskSheet.editing) {
        await updateTask(id!, taskSheet.editing.id, input);
      } else {
        await createTask(id!, input);
      }
      setTaskSheet({ open: false, editing: null });
    } finally {
      setSaving(false);
    }
  };

  const toggleMilestone = (m: Milestone) => {
    if (m.status === 'completed') {
      void updateMilestone(id!, m.id, { status: 'in_progress' });
    } else {
      void updateMilestone(id!, m.id, { status: 'completed', completionPercentage: 100 });
    }
  };

  const toggleTask = (t: Task) => {
    void updateTask(id!, t.id, { status: t.status === 'done' ? 'todo' : 'done' });
  };

  const addRoadmapToWorkspace = async () => {
    if (!latestRoadmap || importingRoadmap) return;
    setImportingRoadmap(true);
    try {
      await importRoadmapToWorkspace(id!, latestRoadmap.roadmap);
      await markImported(latestRoadmap.id);
    } finally {
      setImportingRoadmap(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {project?.title ?? 'Workspace'}
        </Text>
      </View>

      <Text variant="h2">Workspace</Text>

      <Card padded style={styles.healthCard}>
        <View style={styles.healthRow}>
          <View style={{ gap: 4 }}>
            <Text variant="label" tone="secondary">
              Project health
            </Text>
            <ProjectHealthBadge status={health.status} />
          </View>
          <View style={styles.progressWrap}>
            <Text variant="h3" tone="tint">
              {progress}%
            </Text>
            <Text variant="small" tone="muted">
              milestone progress
            </Text>
          </View>
        </View>
        {health.riskFactors.length ? (
          <View style={styles.risks}>
            {health.riskFactors.map((r) => (
              <Text key={r} variant="small" tone="muted">
                • {r}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      <Pressable
        onPress={() => router.push(`/ai/coach?projectId=${id}`)}
        style={[styles.coach, { backgroundColor: theme.backgroundSelected }]}
      >
        <Ionicons name="sparkles" size={20} color={theme.tint} />
        <View style={{ flex: 1 }}>
          <Text variant="label" weight="semibold">
            Ask the AI Build Coach
          </Text>
          <Text variant="caption" tone="secondary">
            Get a roadmap, next steps, and risk checks.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>

      {/* Roadmap */}
      <View style={styles.section}>
        <SectionHeader
          title="AI Roadmap"
          actionLabel={latestRoadmap ? 'View' : undefined}
          onAction={
            latestRoadmap ? () => router.push(`/projects/${id}/roadmap`) : undefined
          }
        />
        <Card padded>
          {latestRoadmap ? (
            <>
              <Text variant="caption" tone="secondary" numberOfLines={3}>
                {latestRoadmap.roadmap.summary}
              </Text>
              {roadmapImported ? (
                <View style={styles.roadmapImported}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                  <Text variant="small" tone="secondary">
                    Added to workspace
                  </Text>
                </View>
              ) : (
                <Button
                  title="Add milestones & tasks to workspace"
                  size="sm"
                  loading={importingRoadmap}
                  style={{ marginTop: Spacing.three }}
                  onPress={addRoadmapToWorkspace}
                />
              )}
            </>
          ) : (
            <EmptyState
              icon="map-outline"
              title="No roadmap yet"
              description="No roadmap yet — generate a 30-day plan and turn it into milestones and tasks."
              actionLabel="Generate roadmap"
              onAction={() => router.push(`/projects/${id}/roadmap`)}
            />
          )}
        </Card>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <SectionHeader
          title={`Team (${activeMembers.length})`}
          actionLabel={isOwner ? 'Manage' : undefined}
          onAction={isOwner ? () => router.push(`/projects/${id}/settings`) : undefined}
        />
        <Card padded>
          {activeMembers.length ? (
            <View style={{ gap: Spacing.three }}>
              {activeMembers.map((m) => (
                <MemberRow key={m.id} member={m} hideStatus isYou={m.userId === profile?.id} />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="people-outline"
              title="No teammates yet"
              description="No teammates yet — invite collaborators or accept join requests to start building together."
              actionLabel={isOwner ? 'Manage members' : undefined}
              onAction={isOwner ? () => router.push(`/projects/${id}/settings`) : undefined}
            />
          )}
        </Card>
        {isOwner ? (
          <View style={{ gap: Spacing.three, marginTop: Spacing.three }}>
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
          </View>
        ) : null}
      </View>

      {/* Team chat */}
      <View style={styles.section}>
        <SectionHeader
          title="Team chat"
          actionLabel="Open"
          onAction={() => router.push(`/projects/${id}/chat`)}
        />
        <Card padded onPress={() => router.push(`/projects/${id}/chat`)}>
          {lastMessage ? (
            <View style={{ gap: 4 }}>
              <View style={styles.chatPreviewTop}>
                <Text variant="caption" weight="semibold">
                  {lastMessage.senderId === profile?.id ? 'You' : lastMessage.senderName}
                </Text>
                <Text variant="small" tone="muted">
                  {formatRelativeTime(lastMessage.createdAt)}
                </Text>
              </View>
              <Text variant="caption" tone="secondary" numberOfLines={2}>
                {lastMessage.body}
              </Text>
            </View>
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              description="No messages yet — start the conversation and get the team moving."
              actionLabel="Open team chat"
              onAction={() => router.push(`/projects/${id}/chat`)}
            />
          )}
        </Card>
      </View>

      {/* Milestones */}
      <View style={styles.section}>
        <SectionHeader
          title={`Milestones${milestones.length ? ` (${milestones.length})` : ''}`}
          actionLabel="Add"
          onAction={() => setMilestoneSheet({ open: true, editing: null })}
        />
        {!loaded ? (
          <LoadingState />
        ) : milestones.length === 0 ? (
          <Card padded>
            <EmptyState
              icon="flag-outline"
              title="No milestones yet"
              description="Generate a roadmap or create your first milestone."
              actionLabel="Create milestone"
              onAction={() => setMilestoneSheet({ open: true, editing: null })}
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {milestones.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                onPress={() => setMilestoneSheet({ open: true, editing: m })}
                onToggleComplete={() => toggleMilestone(m)}
              />
            ))}
          </View>
        )}
      </View>

      {/* Tasks */}
      <View style={styles.section}>
        <SectionHeader
          title={`Tasks${tasks.length ? ` (${tasks.length})` : ''}`}
          actionLabel="Add"
          onAction={() => setTaskSheet({ open: true, editing: null })}
        />
        {!loaded ? (
          <LoadingState />
        ) : tasks.length === 0 ? (
          <Card padded>
            <EmptyState
              icon="checkbox-outline"
              title="No tasks yet"
              description="Break the next milestone into action items."
              actionLabel="Create task"
              onAction={() => setTaskSheet({ open: true, editing: null })}
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                assigneeName={memberName(t.assignedUserId)}
                onPress={() => setTaskSheet({ open: true, editing: t })}
                onToggleDone={() => toggleTask(t)}
              />
            ))}
          </View>
        )}
      </View>

      <MilestoneFormSheet
        visible={milestoneSheet.open}
        initial={milestoneSheet.editing}
        submitting={saving}
        onClose={() => setMilestoneSheet({ open: false, editing: null })}
        onSubmit={submitMilestone}
        onDelete={
          milestoneSheet.editing
            ? () => {
                void deleteMilestone(id!, milestoneSheet.editing!.id);
                setMilestoneSheet({ open: false, editing: null });
              }
            : undefined
        }
      />

      <TaskFormSheet
        visible={taskSheet.open}
        initial={taskSheet.editing}
        members={members}
        submitting={saving}
        onClose={() => setTaskSheet({ open: false, editing: null })}
        onSubmit={submitTask}
        onDelete={
          taskSheet.editing
            ? () => {
                void deleteTask(id!, taskSheet.editing!.id);
                setTaskSheet({ open: false, editing: null });
              }
            : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  healthCard: { marginTop: Spacing.four },
  healthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressWrap: { alignItems: 'flex-end' },
  risks: { marginTop: Spacing.three, gap: 2 },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.card,
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  section: { marginTop: Spacing.six },
  list: { gap: Spacing.three },
  roadmapImported: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  chatPreviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
