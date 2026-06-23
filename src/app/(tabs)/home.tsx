import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AIRecommendationCard } from '@/components/forge/AIRecommendationCard';
import { BuilderCard } from '@/components/forge/BuilderCard';
import { ProjectCard } from '@/components/forge/ProjectCard';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { calculateProjectHealth } from '@/lib/health';
import { fullName } from '@/lib/profile';
import { SAMPLE_BUILDERS, SAMPLE_PROJECTS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

export default function Home() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const name = profile ? fullName(profile).split(' ')[0] : 'Builder';

  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);
  const loadProject = useWorkspaceStore((s) => s.loadProject);
  const milestonesByProject = useWorkspaceStore((s) => s.milestonesByProject);
  const tasksByProject = useWorkspaceStore((s) => s.tasksByProject);

  const builders = SAMPLE_BUILDERS.slice(0, 2);
  const recommended = SAMPLE_PROJECTS.slice(0, 2);

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  const projectIds = projects.map((p) => p.id).join(',');
  useEffect(() => {
    projects.forEach((p) => void loadProject(p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIds, loadProject]);

  const stats = useMemo(() => {
    let completedMilestones = 0;
    let activeBuilds = 0;
    projects.forEach((p) => {
      const ms = milestonesByProject[p.id] ?? [];
      const ts = tasksByProject[p.id] ?? [];
      completedMilestones += ms.filter((m) => m.status === 'completed').length;
      const inMotion = ms.some((m) => m.status !== 'not_started') || ts.length > 0;
      if (inMotion) activeBuilds += 1;
    });
    return {
      projects: projects.length,
      milestones: completedMilestones,
      activeBuilds,
    };
  }, [projects, milestonesByProject, tasksByProject]);

  return (
    <Screen>
      <View style={styles.greeting}>
        <Text variant="caption" tone="muted">
          Welcome back
        </Text>
        <Text variant="h2">Hi {name} 👋</Text>
      </View>

      <AIRecommendationCard
        title="Start your first project"
        body="You have momentum to build. Create a project and Forge will generate a roadmap and recommend collaborators to get you moving."
        actionLabel="Create a project"
        onAction={() => router.push('/projects/create')}
      />

      <View style={styles.section}>
        <SectionHeader
          title="Recommended builders"
          actionLabel="See all"
          onAction={() => router.push('/(tabs)/matches')}
        />
        <View style={styles.list}>
          {builders.map((b) => (
            <BuilderCard
              key={b.userId}
              builder={b}
              onPress={() => router.push(`/matches/${b.userId}`)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Recommended projects"
          actionLabel="Explore"
          onAction={() => router.push('/(tabs)/projects')}
        />
        <View style={styles.list}>
          {recommended.map((p) => (
            <ProjectCard
              key={p.projectId}
              project={{
                id: p.projectId,
                title: p.title,
                description: p.description,
                stage: p.stage,
                healthStatus: p.healthStatus as any,
                skillsNeeded: p.skillsNeeded,
                teamCount: p.teamCount,
                matchScore: p.matchScore,
              }}
              onPress={() => router.push(`/projects/${p.projectId}`)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Active projects" />
        {projects.length === 0 ? (
          <Card padded>
            <EmptyState
              icon="cube-outline"
              title="No active projects yet"
              description="Create your first project to start building momentum."
              actionLabel="Create a project"
              onAction={() => router.push('/projects/create')}
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  title: p.title,
                  description: p.description ?? '',
                  stage: p.stage,
                  healthStatus: calculateProjectHealth({
                    milestones: milestonesByProject[p.id] ?? [],
                    tasks: tasksByProject[p.id] ?? [],
                    teamSize: 1,
                  }).status,
                  skillsNeeded: [],
                  teamCount: 1,
                }}
                onPress={() => router.push(`/projects/${p.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Progress summary" />
        <View style={styles.statsRow}>
          {[
            { label: 'Projects', value: String(stats.projects) },
            { label: 'Milestones', value: String(stats.milestones) },
            { label: 'Active builds', value: String(stats.activeBuilds) },
          ].map((s) => (
            <Card key={s.label} style={{ flex: 1 }} padded>
              <Text variant="h2" tone="tint">
                {s.value}
              </Text>
              <Text variant="caption" tone="secondary">
                {s.label}
              </Text>
            </Card>
          ))}
        </View>
        <Text variant="small" tone="muted" style={{ marginTop: Spacing.three }}>
          Forge measures outcomes, not engagement.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { marginBottom: Spacing.five, gap: 2 },
  section: { marginTop: Spacing.six },
  list: { gap: Spacing.three },
  statsRow: { flexDirection: 'row', gap: Spacing.three },
});
