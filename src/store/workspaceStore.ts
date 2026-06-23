import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  Milestone,
  MilestoneInput,
  Task,
  TaskInput,
} from '@/types/project';

const MILESTONES_KEY = 'forge.milestones';
const TASKS_KEY = 'forge.tasks';

type ByProject<T> = Record<string, T[]>;

interface WorkspaceState {
  milestonesByProject: ByProject<Milestone>;
  tasksByProject: ByProject<Task>;
  loadedProjects: Record<string, boolean>;
  loadProject: (projectId: string) => Promise<void>;
  createMilestone: (projectId: string, input: MilestoneInput) => Promise<Milestone>;
  updateMilestone: (
    projectId: string,
    id: string,
    patch: Partial<MilestoneInput>,
  ) => Promise<void>;
  deleteMilestone: (projectId: string, id: string) => Promise<void>;
  createTask: (projectId: string, input: TaskInput) => Promise<Task>;
  updateTask: (projectId: string, id: string, patch: Partial<TaskInput>) => Promise<void>;
  deleteTask: (projectId: string, id: string) => Promise<void>;
}

// --- local persistence helpers -------------------------------------------
async function loadMap<T>(key: string): Promise<ByProject<T>> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as ByProject<T>) : {};
}

async function saveMap<T>(key: string, map: ByProject<T>) {
  await AsyncStorage.setItem(key, JSON.stringify(map));
}

// --- row mappers ----------------------------------------------------------
function mapMilestone(r: any): Milestone {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description ?? null,
    dueDate: r.due_date ?? null,
    status: r.status ?? 'not_started',
    completionPercentage: r.completion_percentage ?? 0,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

function mapTask(r: any): Task {
  return {
    id: r.id,
    projectId: r.project_id,
    assignedUserId: r.assigned_user_id ?? null,
    title: r.title,
    description: r.description ?? null,
    priority: r.priority ?? 'medium',
    status: r.status ?? 'todo',
    dueDate: r.due_date ?? null,
    createdAt: r.created_at ?? new Date().toISOString(),
    updatedAt: r.updated_at ?? new Date().toISOString(),
  };
}

function normalizeDate(d?: string | null): string | null {
  const t = (d ?? '').trim();
  return t.length ? t : null;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  milestonesByProject: {},
  tasksByProject: {},
  loadedProjects: {},

  loadProject: async (projectId) => {
    if (isSupabaseConfigured) {
      const [m, t] = await Promise.all([
        supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
      ]);
      set((s) => ({
        milestonesByProject: {
          ...s.milestonesByProject,
          [projectId]: (m.data ?? []).map(mapMilestone),
        },
        tasksByProject: { ...s.tasksByProject, [projectId]: (t.data ?? []).map(mapTask) },
        loadedProjects: { ...s.loadedProjects, [projectId]: true },
      }));
      return;
    }

    const [milestones, tasks] = await Promise.all([
      loadMap<Milestone>(MILESTONES_KEY),
      loadMap<Task>(TASKS_KEY),
    ]);
    set((s) => ({
      milestonesByProject: {
        ...s.milestonesByProject,
        [projectId]: milestones[projectId] ?? [],
      },
      tasksByProject: { ...s.tasksByProject, [projectId]: tasks[projectId] ?? [] },
      loadedProjects: { ...s.loadedProjects, [projectId]: true },
    }));
  },

  createMilestone: async (projectId, input) => {
    const now = new Date().toISOString();
    const optimistic: Milestone = {
      id: `local-m-${Date.now()}`,
      projectId,
      title: input.title,
      description: input.description ?? null,
      dueDate: normalizeDate(input.dueDate),
      status: input.status,
      completionPercentage: input.completionPercentage,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: projectId,
          title: input.title,
          description: input.description ?? null,
          due_date: normalizeDate(input.dueDate),
          status: input.status,
          completion_percentage: input.completionPercentage,
        })
        .select('*')
        .single();
      if (!error && data) {
        const created = mapMilestone(data);
        set((s) => ({
          milestonesByProject: {
            ...s.milestonesByProject,
            [projectId]: [...(s.milestonesByProject[projectId] ?? []), created],
          },
        }));
        return created;
      }
    }

    const next = [...(get().milestonesByProject[projectId] ?? []), optimistic];
    set((s) => ({ milestonesByProject: { ...s.milestonesByProject, [projectId]: next } }));
    await persistMilestones(get().milestonesByProject);
    return optimistic;
  },

  updateMilestone: async (projectId, id, patch) => {
    const current = get().milestonesByProject[projectId] ?? [];
    const next = current.map((m) =>
      m.id === id
        ? {
            ...m,
            ...patch,
            dueDate: patch.dueDate !== undefined ? normalizeDate(patch.dueDate) : m.dueDate,
            updatedAt: new Date().toISOString(),
          }
        : m,
    );
    set((s) => ({ milestonesByProject: { ...s.milestonesByProject, [projectId]: next } }));

    if (isSupabaseConfigured) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.dueDate !== undefined) dbPatch.due_date = normalizeDate(patch.dueDate);
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.completionPercentage !== undefined)
        dbPatch.completion_percentage = patch.completionPercentage;
      await supabase.from('project_milestones').update(dbPatch).eq('id', id);
      return;
    }
    await persistMilestones(get().milestonesByProject);
  },

  deleteMilestone: async (projectId, id) => {
    const next = (get().milestonesByProject[projectId] ?? []).filter((m) => m.id !== id);
    set((s) => ({ milestonesByProject: { ...s.milestonesByProject, [projectId]: next } }));
    if (isSupabaseConfigured) {
      await supabase.from('project_milestones').delete().eq('id', id);
      return;
    }
    await persistMilestones(get().milestonesByProject);
  },

  createTask: async (projectId, input) => {
    const now = new Date().toISOString();
    const optimistic: Task = {
      id: `local-t-${Date.now()}`,
      projectId,
      assignedUserId: input.assignedUserId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status,
      dueDate: normalizeDate(input.dueDate),
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          assigned_user_id: input.assignedUserId ?? null,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority,
          status: input.status,
          due_date: normalizeDate(input.dueDate),
        })
        .select('*')
        .single();
      if (!error && data) {
        const created = mapTask(data);
        set((s) => ({
          tasksByProject: {
            ...s.tasksByProject,
            [projectId]: [...(s.tasksByProject[projectId] ?? []), created],
          },
        }));
        return created;
      }
    }

    const next = [...(get().tasksByProject[projectId] ?? []), optimistic];
    set((s) => ({ tasksByProject: { ...s.tasksByProject, [projectId]: next } }));
    await persistTasks(get().tasksByProject);
    return optimistic;
  },

  updateTask: async (projectId, id, patch) => {
    const current = get().tasksByProject[projectId] ?? [];
    const next = current.map((t) =>
      t.id === id
        ? {
            ...t,
            ...patch,
            dueDate: patch.dueDate !== undefined ? normalizeDate(patch.dueDate) : t.dueDate,
            updatedAt: new Date().toISOString(),
          }
        : t,
    );
    set((s) => ({ tasksByProject: { ...s.tasksByProject, [projectId]: next } }));

    if (isSupabaseConfigured) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.dueDate !== undefined) dbPatch.due_date = normalizeDate(patch.dueDate);
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.priority !== undefined) dbPatch.priority = patch.priority;
      if (patch.assignedUserId !== undefined) dbPatch.assigned_user_id = patch.assignedUserId;
      await supabase.from('tasks').update(dbPatch).eq('id', id);
      return;
    }
    await persistTasks(get().tasksByProject);
  },

  deleteTask: async (projectId, id) => {
    const next = (get().tasksByProject[projectId] ?? []).filter((t) => t.id !== id);
    set((s) => ({ tasksByProject: { ...s.tasksByProject, [projectId]: next } }));
    if (isSupabaseConfigured) {
      await supabase.from('tasks').delete().eq('id', id);
      return;
    }
    await persistTasks(get().tasksByProject);
  },
}));

async function persistMilestones(map: ByProject<Milestone>) {
  if (!isSupabaseConfigured) await saveMap(MILESTONES_KEY, map);
}
async function persistTasks(map: ByProject<Task>) {
  if (!isSupabaseConfigured) await saveMap(TASKS_KEY, map);
}
