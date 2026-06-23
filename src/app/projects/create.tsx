import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  INTERESTS,
  PROJECT_STAGES,
  PROJECT_VISIBILITY,
  SKILLS,
} from '@/lib/constants';
import { projectSchema, type ProjectInput } from '@/lib/validators';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

export default function CreateProject() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const createProject = useProjectStore((s) => s.createProject);

  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      description: '',
      industry: '',
      stage: '',
      visibility: 'Public',
      timeCommitment: '',
      lookingForMembers: true,
    },
  });

  const toggleSkill = (name: string) =>
    setSkillsNeeded((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );

  const onSubmit = async (values: ProjectInput) => {
    if (!profile) return;
    setSaving(true);
    try {
      const project = await createProject(values, profile.id, skillsNeeded);
      router.replace(`/projects/${project.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button title="Create project" loading={saving} onPress={handleSubmit(onSubmit)} />
      }
    >
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">New project</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Title"
              placeholder="What are you building?"
              value={value}
              onChangeText={onChange}
              error={errors.title?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description"
              placeholder="Describe the idea, the problem, and what you need."
              value={value}
              onChangeText={onChange}
              multiline
              error={errors.description?.message}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="industry"
        render={({ field: { onChange, value } }) => (
          <SelectField label="Industry" error={errors.industry?.message}>
            {INTERESTS.map((i) => (
              <Chip
                key={i.name}
                label={i.name}
                selected={value === i.name}
                onPress={() => onChange(i.name)}
              />
            ))}
          </SelectField>
        )}
      />

      <Controller
        control={control}
        name="stage"
        render={({ field: { onChange, value } }) => (
          <SelectField label="Stage" error={errors.stage?.message}>
            {PROJECT_STAGES.map((s) => (
              <Chip
                key={s.key}
                label={s.key}
                selected={value === s.key}
                onPress={() => onChange(s.key)}
              />
            ))}
          </SelectField>
        )}
      />

      <SelectField label="Skills needed">
        {SKILLS.map((s) => (
          <Chip
            key={s.name}
            label={s.name}
            selected={skillsNeeded.includes(s.name)}
            onPress={() => toggleSkill(s.name)}
          />
        ))}
      </SelectField>

      <Controller
        control={control}
        name="visibility"
        render={({ field: { onChange, value } }) => (
          <SelectField label="Visibility">
            {PROJECT_VISIBILITY.map((v) => (
              <Chip key={v} label={v} selected={value === v} onPress={() => onChange(v)} />
            ))}
          </SelectField>
        )}
      />

      <Controller
        control={control}
        name="lookingForMembers"
        render={({ field: { onChange, value } }) => (
          <View style={[styles.switchRow, { borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text variant="label">Looking for members</Text>
              <Text variant="caption" tone="muted">
                Show this project in match recommendations.
              </Text>
            </View>
            <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.tint }} />
          </View>
        )}
      />
    </Screen>
  );
}

function SelectField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
        {label}
      </Text>
      <View style={styles.chips}>{children}</View>
      {error ? (
        <Text variant="small" tone="danger" style={{ marginTop: Spacing.one }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.five,
  },
  form: { gap: Spacing.four },
  field: { marginTop: Spacing.five },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.five,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
