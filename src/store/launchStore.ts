import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { SAMPLE_LAUNCHES, SAMPLE_PROJECTS } from '@/lib/sampleData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';
import type { Launch, LaunchFormValues, LaunchListItem } from '@/types/launch';

const LAUNCHES_KEY = 'forge.launches';
const FOLLOWS_KEY = 'forge.launchFollows';

let localSeq = 0;
const localId = () => `local-launch-${Date.now()}-${(localSeq += 1)}`;

interface LaunchState {
  byProject: Record<string, Launch | undefined>;
  feed: LaunchListItem[];
  followsByLaunch: Record<string, boolean>;
  followerBase: Record<string, number>;
  loadedFeed: boolean;
  loadProjectLaunch: (projectId: string) => Promise<void>;
  loadFeed: (userId?: string) => Promise<void>;
  saveLaunch: (projectId: string, values: LaunchFormValues) => Promise<Launch>;
  toggleFollow: (launchId: string, userId: string) => Promise<void>;
  isFollowing: (launchId: string) => boolean;
  followerCount: (launchId: string) => number;
  getEnriched: (launch: Launch) => LaunchListItem;
}

async function loadLaunchMap(): Promise<Record<string, Launch>> {
  const raw = await AsyncStorage.getItem(LAUNCHES_KEY);
  return raw ? (JSON.parse(raw) as Record<string, Launch>) : {};
}
async function saveLaunchMap(map: Record<string, Launch>) {
  await AsyncStorage.setItem(LAUNCHES_KEY, JSON.stringify(map));
}
async function loadFollows(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FOLLOWS_KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}
async function saveFollows(ids: string[]) {
  await AsyncStorage.setItem(FOLLOWS_KEY, JSON.stringify(ids));
}

function projectMeta(projectId: string): { title: string | null; stage: string | null; teamCount: number } {
  const owned = useProjectStore.getState().projects.find((p) => p.id === projectId);
  const sample = SAMPLE_PROJECTS.find((p) => p.projectId === projectId);
  const activeMembers = (useMembershipStore.getState().membersByProject[projectId] ?? []).filter(
    (m) => m.membershipStatus === 'active',
  ).length;
  return {
    title: owned?.title ?? sample?.title ?? null,
    stage: owned?.stage ?? sample?.stage ?? null,
    teamCount: activeMembers || sample?.teamCount || 1,
  };
}

function mapLaunchRow(r: any): Launch {
  return {
    id: r.id,
    projectId: r.project_id,
    launchTitle: r.launch_title,
    launchDescription: r.launch_description ?? null,
    launchStory: r.launch_story ?? null,
    websiteUrl: r.website_url ?? null,
    videoUrl: r.video_url ?? null,
    launchDate: r.launch_date ?? null,
    status: r.status ?? 'draft',
    followerCount: r.follower_count ?? 0,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function sortLaunches(a: Launch, b: Launch) {
  const da = a.launchDate ?? a.createdAt;
  const db = b.launchDate ?? b.createdAt;
  return db.localeCompare(da);
}

export const useLaunchStore = create<LaunchState>((set, get) => ({
  byProject: {},
  feed: [],
  followsByLaunch: {},
  followerBase: {},
  loadedFeed: false,

  getEnriched: (launch) => {
    const meta = projectMeta(launch.projectId);
    return { ...launch, projectTitle: meta.title, projectStage: meta.stage, teamCount: meta.teamCount };
  },

  loadProjectLaunch: async (projectId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('launches')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1);
      const launch = data && data[0] ? mapLaunchRow(data[0]) : undefined;
      set((s) => ({ byProject: { ...s.byProject, [projectId]: launch } }));
      return;
    }
    const map = await loadLaunchMap();
    set((s) => ({ byProject: { ...s.byProject, [projectId]: map[projectId] } }));
  },

  loadFeed: async (userId) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('launches')
        .select('*')
        .eq('status', 'published')
        .order('launch_date', { ascending: false });
      const launches = (data ?? []).map(mapLaunchRow);

      const followerBase: Record<string, number> = {};
      const followsByLaunch: Record<string, boolean> = {};
      const launchIds = launches.map((l) => l.id);
      if (launchIds.length) {
        const { data: followers } = await supabase
          .from('launch_followers')
          .select('launch_id, user_id')
          .in('launch_id', launchIds);
        (followers ?? []).forEach((f: any) => {
          followerBase[f.launch_id] = (followerBase[f.launch_id] ?? 0) + 1;
          if (userId && f.user_id === userId) followsByLaunch[f.launch_id] = true;
        });
      }

      const feed = launches
        .sort(sortLaunches)
        .map((l) => get().getEnriched(l));
      set({ feed, followerBase, followsByLaunch, loadedFeed: true });
      return;
    }

    const map = await loadLaunchMap();
    const follows = await loadFollows();
    const userPublished = Object.values(map).filter((l) => l.status === 'published');
    const merged: Launch[] = [...userPublished];
    SAMPLE_LAUNCHES.forEach((s) => {
      if (s.status === 'published' && !merged.some((l) => l.id === s.id)) merged.push(s);
    });
    const followerBase: Record<string, number> = {};
    merged.forEach((l) => {
      followerBase[l.id] = l.followerCount ?? 0;
    });
    const followsByLaunch: Record<string, boolean> = {};
    follows.forEach((id) => {
      followsByLaunch[id] = true;
    });
    const feed = merged.sort(sortLaunches).map((l) => get().getEnriched(l));
    set({ feed, followerBase, followsByLaunch, loadedFeed: true });
  },

  saveLaunch: async (projectId, values) => {
    const existing = get().byProject[projectId];
    const now = new Date().toISOString();
    const launchDate =
      values.status === 'published'
        ? existing?.launchDate ?? now.slice(0, 10)
        : existing?.launchDate ?? null;

    if (isSupabaseConfigured) {
      const payload = {
        project_id: projectId,
        launch_title: values.launchTitle,
        launch_description: values.launchDescription || null,
        launch_story: values.launchStory || null,
        website_url: values.websiteUrl || null,
        video_url: values.videoUrl || null,
        launch_date: launchDate,
        status: values.status,
      };
      const query = existing
        ? supabase.from('launches').update(payload).eq('id', existing.id).select('*').single()
        : supabase.from('launches').insert(payload).select('*').single();
      const { data, error } = await query;
      if (error || !data) throw error ?? new Error('Failed to save launch');
      const launch = mapLaunchRow(data);
      set((s) => ({ byProject: { ...s.byProject, [projectId]: launch } }));
      if (get().loadedFeed) await get().loadFeed();
      return launch;
    }

    const launch: Launch = {
      id: existing?.id ?? localId(),
      projectId,
      launchTitle: values.launchTitle,
      launchDescription: values.launchDescription || null,
      launchStory: values.launchStory || null,
      websiteUrl: values.websiteUrl || null,
      videoUrl: values.videoUrl || null,
      launchDate,
      status: values.status,
      followerCount: existing?.followerCount ?? 0,
      createdAt: existing?.createdAt ?? now,
    };
    const map = await loadLaunchMap();
    map[projectId] = launch;
    await saveLaunchMap(map);
    set((s) => ({ byProject: { ...s.byProject, [projectId]: launch } }));
    if (get().loadedFeed) await get().loadFeed();
    return launch;
  },

  toggleFollow: async (launchId, userId) => {
    const following = !!get().followsByLaunch[launchId];

    if (isSupabaseConfigured) {
      if (following) {
        await supabase
          .from('launch_followers')
          .delete()
          .eq('launch_id', launchId)
          .eq('user_id', userId);
      } else {
        const { error } = await supabase
          .from('launch_followers')
          .insert({ launch_id: launchId, user_id: userId });
        if (error && !`${error.message}`.includes('duplicate')) throw error;
      }
    } else {
      const follows = await loadFollows();
      const next = following ? follows.filter((id) => id !== launchId) : [...new Set([...follows, launchId])];
      await saveFollows(next);
    }

    set((s) => ({ followsByLaunch: { ...s.followsByLaunch, [launchId]: !following } }));
  },

  isFollowing: (launchId) => !!get().followsByLaunch[launchId],

  followerCount: (launchId) => {
    const base = get().followerBase[launchId] ?? 0;
    const following = get().followsByLaunch[launchId];
    // In Supabase mode the base already includes the current user's follow.
    if (isSupabaseConfigured) return base;
    return base + (following ? 1 : 0);
  },
}));
