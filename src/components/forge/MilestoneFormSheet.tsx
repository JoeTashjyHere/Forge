import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { MILESTONE_STATUSES } from '@/lib/constants';
import { milestoneSchema, type MilestoneFormInput } from '@/lib/validators';
import type { Milestone, MilestoneInput, MilestoneStatus } from '@/types/project';

interface MilestoneFormSheetProps {
  visible: boolean;
  onClose: () => void;
  initial?: Milestone | null;
  onSubmit: (input: MilestoneInput) => Promise<void> | void;
  onDelete?: () => void;
  submitting?: boolean;
}

const COMPLETION_OPTIONS = [0, 25, 50, 75, 100].map((n) => ({
  key: String(n),
  label: `${n}%`,
}));

function defaults(initial?: Milestone | null): MilestoneFormInput {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    dueDate: initial?.dueDate ?? '',
    status: initial?.status ?? 'not_started',
    completionPercentage: initial?.completionPercentage ?? 0,
  };
}

export function MilestoneFormSheet({
  visible,
  onClose,
  initial,
  onSubmit,
  onDelete,
  submitting,
}: MilestoneFormSheetProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MilestoneFormInput>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: defaults(initial),
  });

  useEffect(() => {
    if (visible) reset(defaults(initial));
  }, [visible, initial, reset]);

  const submit = async (values: MilestoneFormInput) => {
    const completed = values.status === 'completed';
    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      dueDate: values.dueDate || null,
      status: values.status,
      completionPercentage: completed ? 100 : values.completionPercentage,
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={initial ? 'Edit milestone' : 'New milestone'}
      footer={
        <View style={{ gap: Spacing.three }}>
          <Button
            title={initial ? 'Save milestone' : 'Create milestone'}
            loading={submitting}
            onPress={handleSubmit(submit)}
          />
          {initial && onDelete ? (
            <Button title="Delete milestone" variant="ghost" onPress={onDelete} />
          ) : null}
        </View>
      }
    >
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Title"
            placeholder="e.g. Ship the MVP"
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
            placeholder="What does done look like?"
            value={value ?? ''}
            onChangeText={onChange}
            multiline
            error={errors.description?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Due date"
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            value={value ?? ''}
            onChangeText={onChange}
            error={errors.dueDate?.message}
          />
        )}
      />

      <View style={{ gap: Spacing.two }}>
        <Text variant="label" tone="secondary">
          Status
        </Text>
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <Segmented<MilestoneStatus>
              wrap
              options={MILESTONE_STATUSES}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </View>

      <View style={{ gap: Spacing.two }}>
        <Text variant="label" tone="secondary">
          Completion
        </Text>
        <Controller
          control={control}
          name="completionPercentage"
          render={({ field: { onChange, value } }) => (
            <Segmented
              options={COMPLETION_OPTIONS}
              value={String(value)}
              onChange={(v) => onChange(Number(v))}
            />
          )}
        />
      </View>
    </Sheet>
  );
}
