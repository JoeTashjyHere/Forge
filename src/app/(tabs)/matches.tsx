import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BuilderCard } from '@/components/forge/BuilderCard';
import { ProjectCard } from '@/components/forge/ProjectCard';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { SAMPLE_BUILDERS, SAMPLE_PROJECTS } from '@/lib/sampleData';

export default function MatchesTab() {
  const router = useRouter();
  const recommendedBuilders = SAMPLE_BUILDERS.filter((b) => !b.isUnexpected);
  const unexpected = SAMPLE_BUILDERS.filter((b) => b.isUnexpected);
  const recommendedProjects = SAMPLE_PROJECTS.filter((p) => !p.isUnexpected);

  return (
    <Screen>
      <Text variant="h2" style={{ marginBottom: Spacing.two }}>
        Matches
      </Text>
      <Text tone="secondary" style={{ marginBottom: Spacing.five }}>
        People and projects most likely to help you build.
      </Text>

      <View style={styles.section}>
        <SectionHeader title="Recommended builders" />
        <View style={styles.list}>
          {recommendedBuilders.map((b) => (
            <BuilderCard
              key={b.userId}
              builder={b}
              onPress={() => router.push(`/matches/${b.userId}`)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recommended projects" />
        <View style={styles.list}>
          {recommendedProjects.map((p) => (
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

      {unexpected.length ? (
        <View style={styles.section}>
          <SectionHeader title="Unexpected matches" />
          <Text variant="caption" tone="muted" style={{ marginBottom: Spacing.three }}>
            Outside your stated preferences, but valuable for complementary skills or stage fit.
          </Text>
          <View style={styles.list}>
            {unexpected.map((b) => (
              <BuilderCard
                key={b.userId}
                builder={b}
                onPress={() => router.push(`/matches/${b.userId}`)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.five },
  list: { gap: Spacing.three },
});
