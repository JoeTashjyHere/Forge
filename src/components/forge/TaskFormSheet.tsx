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
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants';
import { taskSchema, type TaskFormInput } from '@/lib/validators';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '@/types/project';

export interface AssignableMember {
  id: string;
  name: string;
}

interface TaskFormSheetProps {
  visible: boolean;
  onClose: () => void;
  initial?: Task | null;
  members?: AssignableMember[];
  onSubmit: (input: TaskInput) => Promise<void> | void;
  onDelete?: () => void;
  submitting?: boolean;
}

const NONE = 'none';

function defaults(initial?: Task | null): TaskFormInput {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    dueDate: initial?.dueDate ?? '',
    status: initial?.status ?? 'todo',
    priority: initial?.priority ?? 'medium',
    assignedUserId: initial?.assignedUserId ?? null,
  };
}

export function TaskFormSheet({
  visible,
  onClose,
  initial,
  members = [],
  onSubmit,
  onDelete,
  submitting,
}: TaskFormSheetProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaults(initial),
  });

  useEffect(() => {
    if (visible) reset(defaults(initial));
  }, [visible, initial, reset]);

  const submit = async (values: TaskFormInput) => {
    await onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      dueDate: values.dueDate || null,
      status: values.status,
      priority: values.priority,
      assignedUserId: values.assignedUserId ?? null,
    });
  };

  const assigneeOptions = [
    { key: NONE, label: 'Unassigned' },
    ...members.map((m) => ({ key: m.id, label: m.name })),
  ];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={initial ? 'Edit task' : 'New task'}
      footer={
        <View style={{ gap: Spacing.three }}>
          <Button
            title={initial ? 'Save task' : 'Create task'}
            loading={submitting}
            onPress={handleSubmit(submit)}
          />
          {initial && onDelete ? (
            <Button title="Delete task" variant="ghost" onPress={onDelete} />
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
            placeholder="e.g. Design the onboarding flow"
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
            placeholder="Add details (optional)"
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
            <Segmented<TaskStatus> wrap options={TASK_STATUSES} value={value} onChange={onChange} />
          )}
        />
      </View>

      <View style={{ gap: Spacing.two }}>
        <Text variant="label" tone="secondary">
          Priority
        </Text>
        <Controller
          control={control}
          name="priority"
          render={({ field: { onChange, value } }) => (
            <Segmented<TaskPriority> options={TASK_PRIORITIES} value={value} onChange={onChange} />
          )}
        />
      </View>

      {members.length ? (
        <View style={{ gap: Spacing.two }}>
          <Text variant="label" tone="secondary">
            Assignee
          </Text>
          <Controller
            control={control}
            name="assignedUserId"
            render={({ field: { onChange, value } }) => (
              <Segmented
                wrap
                options={assigneeOptions}
                value={value ?? NONE}
                onChange={(v) => onChange(v === NONE ? null : v)}
              />
            )}
          />
        </View>
      ) : null}
    </Sheet>
  );
}
