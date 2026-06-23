import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  buildDemoRoadmap,
  generateRoadmapRemote,
  parseRoadmap,
  type RoadmapInput,
} from '@/lib/roadmap';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { StoredRoadmap } from '@/types/ai';

const ROADMAPS_KEY = 'forge.roadmaps';
const IMPORTED_KEY = 'forge.roadmaps.imported';

let localSeq = 0;

interface RoadmapState {
  roadmapsByProject: Record<string, StoredRoadmap[]>;
  importedIds: Record<string, boolean>;
  loadedProjects: Record<string, boolean>;
  loadProject: (projectId: string) => Promise<void>;
  generateAndSave: (input: RoadmapInput & { generatedBy?: string | null }) => Promise<StoredRoadmap>;
  markImported: (roadmapId: string) => Promise<void>;
  latest: (projectId: string) => StoredRoadmap | undefined;
}

async function loadLocalMap(): Promise<Record<string, StoredRoadmap[]>> {
  const raw = await AsyncStorage.getItem(ROADMAPS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, StoredRoadmap[]>) : {};
}

async function saveLocalMap(map: Record<string, StoredRoadmap[]>) {
  await AsyncStorage.setItem(ROADMAPS_KEY, JSON.stringify(map));
}

async function loadImported(): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(IMPORTED_KEY);
  return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
}

function mapRow(r: any): StoredRoadmap | null {
  const roadmap = parseRoadmap(r.roadmap_json);
  if (!roadmap) return null;
  return {
    id: r.id,
    projectId: r.project_id,
    roadmap,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export const useRoadmapStore = create<RoadmapState>((set, get) => ({
  roadmapsByProject: {},
  importedIds: {},
  loadedProjects: {},

  loadProject: async (projectId) => {
    const importedIds = await loadImported();

    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('ai_roadmaps')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      const roadmaps = (data ?? [])
        .map(mapRow)
        .filter((r): r is StoredRoadmap => r !== null);
      set((s) => ({
        roadmapsByProject: { ...s.roadmapsByProject, [projectId]: roadmaps },
        importedIds,
        loadedProjects: { ...s.loadedProjects, [projectId]: true },
      }));
      return;
    }

    const map = await loadLocalMap();
    set((s) => ({
      roadmapsByProject: { ...s.roadmapsByProject, [projectId]: map[projectId] ?? [] },
      importedIds,
      loadedProjects: { ...s.loadedProjects, [projectId]: true },
    }));
  },

  generateAndSave: async (input) => {
    const { projectId } = input;

    if (isSupabaseConfigured) {
      try {
        // Edge function generates AND persists the row; reload to pick it up.
        await generateRoadmapRemote(input);
        await get().loadProject(projectId);
        const latest = get().roadmapsByProject[projectId]?.[0];
        if (latest) return latest;
      } catch {
        // Edge function unavailable/failed — fall back to a demo roadmap that
        // we persist directly so the feature still works.
      }
      const roadmap = buildDemoRoadmap(input);
      const { data } = await supabase
        .from('ai_roadmaps')
        .insert({
          project_id: projectId,
          generated_by: input.generatedBy ?? null,
          roadmap_json: roadmap,
        })
        .select('*')
        .single();
      const stored = (data && mapRow(data)) ?? {
        id: `local-r-${Date.now()}-${(localSeq += 1)}`,
        projectId,
        roadmap,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        roadmapsByProject: {
          ...s.roadmapsByProject,
          [projectId]: [stored, ...(s.roadmapsByProject[projectId] ?? [])],
        },
      }));
      return stored;
    }

    const roadmap = buildDemoRoadmap(input);
    const stored: StoredRoadmap = {
      id: `local-r-${Date.now()}-${(localSeq += 1)}`,
      projectId,
      roadmap,
      createdAt: new Date().toISOString(),
    };
    const next = [stored, ...(get().roadmapsByProject[projectId] ?? [])];
    set((s) => ({ roadmapsByProject: { ...s.roadmapsByProject, [projectId]: next } }));
    const map = await loadLocalMap();
    map[projectId] = next;
    await saveLocalMap(map);
    return stored;
  },

  markImported: async (roadmapId) => {
    const next = { ...get().importedIds, [roadmapId]: true };
    set({ importedIds: next });
    await AsyncStorage.setItem(IMPORTED_KEY, JSON.stringify(next));
  },

  latest: (projectId) => get().roadmapsByProject[projectId]?.[0],
}));
