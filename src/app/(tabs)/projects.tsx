import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectCard } from '@/components/forge/ProjectCard';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SAMPLE_PROJECTS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

export default function ProjectsTab() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const myProjects = useProjectStore((s) => s.projects);
  const load = useProjectStore((s) => s.load);

  useEffect(() => {
    if (profile?.id) void load(profile.id);
  }, [profile?.id, load]);

  return (
    <Screen>
      <View style={styles.titleRow}>
        <Text variant="h2">Projects</Text>
        <Pressable
          onPress={() => router.push('/projects/create')}
          style={[styles.newBtn, { backgroundColor: theme.tint }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={theme.textInverse} />
          <Text style={{ color: theme.textInverse, fontWeight: '600' }}>New</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader title="My projects" />
        {myProjects.length === 0 ? (
          <Card padded>
            <EmptyState
              icon="cube-outline"
              title="No projects yet"
              description="Turn an idea into momentum. Create a project and Forge will help you build a team and a roadmap."
              actionLabel="Create a project"
              onAction={() => router.push('/projects/create')}
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {myProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={{
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  stage: p.stage,
                  healthStatus: p.healthStatus,
                  teamCount: 1,
                }}
                onPress={() => router.push(`/projects/${p.id}`)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recommended for you" />
        <View style={styles.list}>
          {SAMPLE_PROJECTS.map((p) => (
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  section: { marginTop: Spacing.five },
  list: { gap: Spacing.three },
});
