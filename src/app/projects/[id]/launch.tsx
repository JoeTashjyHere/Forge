import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import type { BuilderArchetype } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import { analyzeLaunchReadiness } from '@/lib/launchReadiness';
import { canManageMembers } from '@/lib/permissions';
import { fullName } from '@/lib/profile';
import { analyzeTeam } from '@/lib/teamBuilder';
import { launchSchema, type LaunchFormInput } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';
import { useLaunchStore } from '@/store/launchStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useWorkspaceStore } from '@/store/workspaceStore';

const STATUS_OPTIONS: { key: 'draft' | 'published'; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
];

export default function LaunchEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const existing = useLaunchStore((s) => s.byProject[id!]);
  const loadProjectLaunch = useLaunchStore((s) => s.loadProjectLaunch);
  const saveLaunch = useLaunchStore((s) => s.saveLaunch);

  const members = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const milestones = useWorkspaceStore((s) => s.milestonesByProject[id!] ?? []);
  const tasks = useWorkspaceStore((s) => s.tasksByProject[id!] ?? []);
  const loadWorkspace = useWorkspaceStore((s) => s.loadProject);
  const loadRoadmaps = useRoadmapStore((s) => s.loadProject);
  const latestRoadmap = useRoadmapStore((s) => s.roadmapsByProject[id!]?.[0] ?? null);

  const [saving, setSaving] = useState(false);

  const isOwner = project?.ownerId === profile?.id;
  const canManage = project && profile ? canManageMembers(project, profile.id, members) : false;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LaunchFormInput>({
    resolver: zodResolver(launchSchema),
    defaultValues: {
      launchTitle: '',
      launchDescription: '',
      websiteUrl: '',
      videoUrl: '',
      launchStory: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  useEffect(() => {
    if (!id) return;
    void loadProjectLaunch(id);
    void loadWorkspace(id);
    void loadRoadmaps(id);
    const ownerUser =
      isOwner && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
  }, [id, isOwner, profile, loadProjectLaunch, loadWorkspace, loadRoadmaps, loadMembers]);

  useEffect(() => {
    if (existing) {
      reset({
        launchTitle: existing.launchTitle,
        launchDescription: existing.launchDescription ?? '',
        websiteUrl: existing.websiteUrl ?? '',
        videoUrl: existing.videoUrl ?? '',
        launchStory: existing.launchStory ?? '',
        status: existing.status,
      });
    } else if (project) {
      reset({
        launchTitle: project.title,
        launchDescription: project.description ?? '',
        websiteUrl: '',
        videoUrl: '',
        launchStory: '',
        status: 'draft',
      });
    }
  }, [existing, project, reset]);

  const status = useWatch({ control, name: 'status' }) ?? 'draft';

  const readinessScore = useMemo(() => {
    if (!project) return null;
    const activeMembers = members.filter((m) => m.membershipStatus === 'active');
    const teamAnalysis = analyzeTeam({
      project: { stage: project.stage, skillsNeeded: project.skillsNeeded },
      members: activeMembers,
      ownerId: project.ownerId,
      ownerArchetype: (profile?.builderArchetype as BuilderArchetype | null) ?? null,
    });
    return analyzeLaunchReadiness(project, milestones, tasks, teamAnalysis, latestRoadmap)
      .readinessScore;
  }, [project, members, milestones, tasks, latestRoadmap, profile]);

  const submit = async (values: LaunchFormInput) => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const launch = await saveLaunch(id, {
        launchTitle: values.launchTitle.trim(),
        launchDescription: values.launchDescription.trim(),
        websiteUrl: values.websiteUrl?.trim() ?? '',
        videoUrl: values.videoUrl?.trim() ?? '',
        launchStory: values.launchStory?.trim() ?? '',
        status: values.status,
      });
      if (launch.status === 'published') router.replace(`/marketplace/${launch.id}`);
      else router.back();
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <Screen edges={['top']}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <Text variant="h4">Launch</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text tone="secondary" style={{ marginTop: Spacing.five }}>
          Only the project owner or an admin can create or edit the launch.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">{existing ? 'Edit launch' : 'Publish launch'}</Text>
        <View style={{ width: 26 }} />
      </View>

      {status === 'published' && readinessScore !== null && readinessScore < 75 ? (
        <Card padded style={{ ...styles.warning, borderColor: '#F59E0B' }}>
          <Ionicons name="warning-outline" size={18} color="#F59E0B" />
          <Text variant="caption" style={{ flex: 1 }}>
            Launch readiness is {readinessScore}/100. You can still publish, but consider closing key
            gaps first.
          </Text>
        </Card>
      ) : null}

      <View style={styles.form}>
        <Controller
          control={control}
          name="launchTitle"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Launch title"
              placeholder="e.g. Lumen — AI study companion"
              value={value}
              onChangeText={onChange}
              error={errors.launchTitle?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="launchDescription"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description"
              placeholder="One or two sentences on what you built."
              value={value}
              onChangeText={onChange}
              multiline
              error={errors.launchDescription?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="websiteUrl"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Website URL"
              placeholder="https://"
              autoCapitalize="none"
              value={value ?? ''}
              onChangeText={onChange}
              error={errors.websiteUrl?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="videoUrl"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Video URL (optional)"
              placeholder="https://"
              autoCapitalize="none"
              value={value ?? ''}
              onChangeText={onChange}
              error={errors.videoUrl?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="launchStory"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Build story (optional)"
              placeholder="How did this come together? Who built it?"
              value={value ?? ''}
              onChangeText={onChange}
              multiline
              error={errors.launchStory?.message}
            />
          )}
        />

        <View style={[styles.assets, { borderColor: theme.border }]}>
          <Ionicons name="images-outline" size={20} color={theme.textMuted} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            Screenshot uploads are coming soon.
          </Text>
        </View>

        <View style={{ gap: Spacing.two }}>
          <Text variant="label" tone="secondary">
            Status
          </Text>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Segmented options={STATUS_OPTIONS} value={value} onChange={onChange} />
            )}
          />
        </View>

        <Button
          title={status === 'published' ? 'Publish launch' : 'Save draft'}
          loading={saving}
          onPress={handleSubmit(submit)}
        />
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
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    marginBottom: Spacing.four,
  },
  form: { gap: Spacing.four },
  assets: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
});
