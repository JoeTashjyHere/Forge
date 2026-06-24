import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoadmapView } from '@/components/forge/RoadmapView';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { trackEvent } from '@/lib/analytics';
import { importRoadmapToWorkspace } from '@/lib/roadmap';
import { getProfileDetails } from '@/lib/profileDetails';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';

export default function RoadmapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const loadRoadmaps = useRoadmapStore((s) => s.loadProject);
  const generateAndSave = useRoadmapStore((s) => s.generateAndSave);
  const markImported = useRoadmapStore((s) => s.markImported);
  const loaded = useRoadmapStore((s) => !!s.loadedProjects[id!]);
  const roadmaps = useRoadmapStore((s) => s.roadmapsByProject[id!] ?? []);
  const importedIds = useRoadmapStore((s) => s.importedIds);

  const latest = roadmaps[0];
  const isImported = latest ? !!importedIds[latest.id] : false;

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedNow, setImportedNow] = useState(false);

  useEffect(() => {
    if (id) void loadRoadmaps(id);
  }, [id, loadRoadmaps]);

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  const generate = async () => {
    if (!id || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const details = profile?.id
        ? await getProfileDetails(profile.id)
        : { skills: [], goals: [] };
      await generateAndSave({
        projectId: id,
        title: project?.title ?? 'Your project',
        description: project?.description ?? '',
        stage: project?.stage ?? 'Idea',
        skills: details.skills.map((s) => s.name),
        goals: details.goals,
        generatedBy: profile?.id ?? null,
      });
    } catch {
      setError('We could not generate a roadmap just now. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const addToWorkspace = async () => {
    if (!id || !latest || importing) return;
    setImporting(true);
    try {
      await importRoadmapToWorkspace(id, latest.roadmap);
      await markImported(latest.id);
      void trackEvent('roadmap_added_to_workspace', profile?.id ?? null, { projectId: id });
      setImportedNow(true);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="label" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
          {project?.title ?? 'Roadmap'}
        </Text>
      </View>

      <Text variant="h2">AI Roadmap</Text>

      {/* Generating with no existing roadmap */}
      {generating && !latest ? (
        <LoadingState label="Generating your 30-day plan…" />
      ) : null}

      {/* Error state */}
      {error && !latest ? (
        <Card padded style={styles.block}>
          <EmptyState
            icon="alert-circle-outline"
            title="Couldn’t generate roadmap"
            description={error}
            actionLabel="Try again"
            onAction={generate}
          />
        </Card>
      ) : null}

      {/* Empty state */}
      {!generating && !error && loaded && !latest ? (
        <Card padded style={styles.block}>
          <EmptyState
            icon="map-outline"
            title="No roadmap yet"
            description="No roadmap yet — generate a 30-day plan and turn it into milestones and tasks."
            actionLabel="Generate Roadmap"
            onAction={generate}
          />
        </Card>
      ) : null}

      {/* Loading existing roadmaps */}
      {!loaded && !generating ? <LoadingState /> : null}

      {/* Success: roadmap exists */}
      {latest ? (
        <View style={styles.block}>
          {error ? (
            <Card padded style={{ marginBottom: Spacing.four }}>
              <Text variant="caption" tone="danger">
                {error}
              </Text>
            </Card>
          ) : null}

          {isImported || importedNow ? (
            <Card padded style={{ ...styles.success, borderColor: theme.success }}>
              <View style={styles.successHead}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text variant="label" weight="semibold">
                  Added to workspace
                </Text>
              </View>
              <Text variant="caption" tone="secondary" style={{ marginTop: 4 }}>
                Roadmap added to workspace. Your next milestones and tasks are ready.
              </Text>
              <Button
                title="Open workspace"
                size="sm"
                variant="secondary"
                style={{ marginTop: Spacing.three }}
                onPress={() => router.replace(`/projects/${id}/workspace`)}
              />
            </Card>
          ) : null}

          <RoadmapView roadmap={latest.roadmap} />

          <View style={styles.actions}>
            {!isImported && !importedNow ? (
              <Button
                title="Add to Workspace"
                loading={importing}
                onPress={addToWorkspace}
              />
            ) : null}
            <Button
              title="Ask AI Coach about this roadmap"
              variant="secondary"
              onPress={() => router.push(`/ai/coach?projectId=${id}`)}
            />
            <Button
              title={generating ? 'Regenerating…' : 'Regenerate roadmap'}
              variant="ghost"
              loading={generating}
              onPress={generate}
            />
          </View>
        </View>
      ) : null}
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
  block: { marginTop: Spacing.five },
  success: { borderWidth: 1.5, marginBottom: Spacing.five },
  successHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actions: { marginTop: Spacing.six, gap: Spacing.three },
});
