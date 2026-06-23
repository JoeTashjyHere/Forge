import { useRouter } from 'expo-router';
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
import { fullName } from '@/lib/profile';
import { SAMPLE_BUILDERS, SAMPLE_PROJECTS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const name = profile ? fullName(profile).split(' ')[0] : 'Builder';

  const builders = SAMPLE_BUILDERS.slice(0, 2);
  const projects = SAMPLE_PROJECTS.slice(0, 2);

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
          {projects.map((p) => (
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
        <Card padded>
          <EmptyState
            icon="cube-outline"
            title="No active projects yet"
            description="Create your first project to start building momentum."
            actionLabel="Create a project"
            onAction={() => router.push('/projects/create')}
          />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Progress summary" />
        <View style={styles.statsRow}>
          {[
            { label: 'Projects', value: '0' },
            { label: 'Milestones', value: '0' },
            { label: 'Active builds', value: '0' },
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
