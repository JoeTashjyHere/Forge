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
import { SAMPLE_PROJECTS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const load = useProjectStore((s) => s.load);
  const loaded = useProjectStore((s) => s.loaded);
  const owned = useProjectStore((s) => s.projects.find((p) => p.id === id));

  useEffect(() => {
    if (!loaded && profile?.id) void load(profile.id);
  }, [loaded, profile?.id, load]);

  const sample = SAMPLE_PROJECTS.find((p) => p.projectId === id);
  const isOwner = !!owned;

  const title = owned?.title ?? sample?.title ?? 'Project';
  const description = owned?.description ?? sample?.description ?? '';
  const stage = owned?.stage ?? sample?.stage ?? 'Idea';
  const health = owned?.healthStatus ?? (sample?.healthStatus as any) ?? 'Needs Attention';
  const skills = sample?.skillsNeeded ?? [];

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

      <View style={styles.actions}>
        {isOwner ? (
          <>
            <Button
              title="Open workspace"
              onPress={() => router.push(`/projects/${id}/workspace`)}
            />
            <Button
              title="Ask the AI coach"
              variant="secondary"
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
});
