import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { trackEvent } from '@/lib/analytics';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ProjectInput } from '@/lib/validators';
import type { Project } from '@/types/project';

const LOCAL_KEY = 'forge.projects';

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) +
    '-' +
    Math.random().toString(36).slice(2, 6)
  );
}

interface ProjectState {
  projects: Project[];
  loaded: boolean;
  load: (ownerId: string) => Promise<void>;
  createProject: (
    input: ProjectInput,
    ownerId: string,
    skillsNeeded?: string[],
  ) => Promise<Project>;
  getById: (id: string) => Project | undefined;
}

async function loadLocal(): Promise<Project[]> {
  const raw = await AsyncStorage.getItem(LOCAL_KEY);
  return raw ? (JSON.parse(raw) as Project[]) : [];
}

async function saveLocal(projects: Project[]) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(projects));
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loaded: false,

  load: async (ownerId) => {
    if (isSupabaseConfigured && ownerId) {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });
      if (data) {
        set({
          projects: data.map((r: any) => mapProject(r)),
          loaded: true,
        });
        return;
      }
    }
    set({ projects: await loadLocal(), loaded: true });
  },

  createProject: async (input, ownerId, skillsNeeded = []) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `local-${Date.now()}`,
      ownerId,
      title: input.title,
      slug: slugify(input.title),
      description: input.description,
      industry: input.industry,
      stage: input.stage as Project['stage'],
      visibility: input.visibility,
      healthStatus: 'Needs Attention',
      timeCommitment: input.timeCommitment ?? null,
      lookingForMembers: input.lookingForMembers,
      launchStatus: 'draft',
      skillsNeeded,
      createdAt: now,
      updatedAt: now,
    };

    if (isSupabaseConfigured && ownerId) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: ownerId,
          title: input.title,
          slug: project.slug,
          description: input.description,
          industry: input.industry,
          stage: input.stage,
          visibility: input.visibility,
          time_commitment: input.timeCommitment,
          looking_for_members: input.lookingForMembers,
        })
        .select('*')
        .single();
      if (!error && data) {
        const created = mapProject(data);
        // Owner becomes the first project member.
        await supabase.from('project_members').insert({
          project_id: created.id,
          user_id: ownerId,
          role: 'Owner',
          membership_status: 'active',
        });
        if (skillsNeeded.length) {
          await supabase.from('project_skills_needed').insert(
            skillsNeeded.map((skill_name, i) => ({
              project_id: created.id,
              skill_name,
              priority: i + 1,
            })),
          );
        }
        set((s) => ({ projects: [created, ...s.projects] }));
        void trackEvent('project_created', ownerId, { projectId: created.id });
        return created;
      }
    }

    const next = [project, ...get().projects];
    set({ projects: next });
    await saveLocal(next);
    void trackEvent('project_created', ownerId, { projectId: project.id });
    return project;
  },

  getById: (id) => get().projects.find((p) => p.id === id),
}));

function mapProject(r: any): Project {
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    industry: r.industry,
    stage: r.stage,
    visibility: r.visibility,
    healthStatus: r.health_status ?? 'Needs Attention',
    timeCommitment: r.time_commitment,
    lookingForMembers: r.looking_for_members,
    launchStatus: r.launch_status ?? 'draft',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
