import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ProjectRole } from '@/lib/constants';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { MembershipStatus, ProjectMember } from '@/types/project';

const MEMBERS_KEY = 'forge.members';

let localSeq = 0;
const localId = (p: string) => `${p}-${Date.now()}-${(localSeq += 1)}`;

export interface MemberParticipant {
  id: string;
  name: string;
  photoUrl?: string | null;
}

interface MembershipState {
  membersByProject: Record<string, ProjectMember[]>;
  loadedProjects: Record<string, boolean>;
  loadMembers: (projectId: string, ownerUser?: MemberParticipant) => Promise<void>;
  requestToJoin: (projectId: string, user: MemberParticipant) => Promise<'requested' | 'exists'>;
  inviteBuilder: (
    projectId: string,
    builder: MemberParticipant,
    role: ProjectRole,
  ) => Promise<void>;
  respondToRequest: (projectId: string, memberId: string, accept: boolean) => Promise<void>;
  acceptInvite: (projectId: string, memberId: string) => Promise<void>;
  declineInvite: (projectId: string, memberId: string) => Promise<void>;
  updateRole: (projectId: string, memberId: string, role: ProjectRole) => Promise<void>;
  removeMember: (projectId: string, memberId: string) => Promise<void>;
  activeMembers: (projectId: string) => ProjectMember[];
  myMembership: (projectId: string, userId: string) => ProjectMember | undefined;
}

// --- local persistence ----------------------------------------------------
async function loadMap(): Promise<Record<string, ProjectMember[]>> {
  const raw = await AsyncStorage.getItem(MEMBERS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, ProjectMember[]>) : {};
}
async function saveMap(map: Record<string, ProjectMember[]>) {
  await AsyncStorage.setItem(MEMBERS_KEY, JSON.stringify(map));
}

function nameFromRow(u: any): string {
  return (
    u?.display_name ||
    [u?.first_name, u?.last_name].filter(Boolean).join(' ') ||
    'Builder'
  );
}

function isLastActiveOwner(members: ProjectMember[], member: ProjectMember): boolean {
  if (member.role !== 'Owner' || member.membershipStatus !== 'active') return false;
  const owners = members.filter((m) => m.role === 'Owner' && m.membershipStatus === 'active');
  return owners.length <= 1;
}

/** Builds the demo seed for an owned project: owner + one active teammate + one join request. */
function seedDemoMembers(projectId: string, ownerUser: MemberParticipant): ProjectMember[] {
  const now = new Date().toISOString();
  const active = SAMPLE_BUILDERS[2];
  const pending = SAMPLE_BUILDERS[0];
  return [
    {
      id: localId('local-pm'),
      projectId,
      userId: ownerUser.id,
      role: 'Owner',
      membershipStatus: 'active',
      joinedAt: now,
      displayName: ownerUser.name,
      profilePhotoUrl: ownerUser.photoUrl ?? null,
    },
    {
      id: localId('local-pm'),
      projectId,
      userId: active!.userId,
      role: 'Contributor',
      membershipStatus: 'active',
      joinedAt: now,
      displayName: active!.displayName,
      profilePhotoUrl: active!.profilePhotoUrl,
    },
    {
      id: localId('local-pm'),
      projectId,
      userId: pending!.userId,
      role: 'Contributor',
      membershipStatus: 'pending',
      joinedAt: now,
      displayName: pending!.displayName,
      profilePhotoUrl: pending!.profilePhotoUrl,
    },
  ];
}

export const useMembershipStore = create<MembershipState>((set, get) => ({
  membersByProject: {},
  loadedProjects: {},

  loadMembers: async (projectId, ownerUser) => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .order('joined_at', { ascending: true });
      const rows = (data ?? []) as any[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const userMap = new Map<string, any>();
      if (userIds.length) {
        const { data: users } = await supabase
          .from('users')
          .select('id, display_name, first_name, last_name, profile_photo_url')
          .in('id', userIds);
        (users ?? []).forEach((u: any) => userMap.set(u.id, u));
      }
      const members: ProjectMember[] = rows.map((r) => {
        const u = userMap.get(r.user_id);
        return {
          id: r.id,
          projectId: r.project_id,
          userId: r.user_id,
          role: r.role,
          membershipStatus: r.membership_status,
          joinedAt: r.joined_at,
          displayName: u ? nameFromRow(u) : null,
          profilePhotoUrl: u?.profile_photo_url ?? null,
        };
      });
      set((s) => ({
        membersByProject: { ...s.membersByProject, [projectId]: members },
        loadedProjects: { ...s.loadedProjects, [projectId]: true },
      }));
      return;
    }

    const map = await loadMap();
    let members = map[projectId];
    if (!members) {
      members = ownerUser ? seedDemoMembers(projectId, ownerUser) : [];
      if (members.length) {
        map[projectId] = members;
        await saveMap(map);
      }
    }
    set((s) => ({
      membersByProject: { ...s.membersByProject, [projectId]: members ?? [] },
      loadedProjects: { ...s.loadedProjects, [projectId]: true },
    }));
  },

  requestToJoin: async (projectId, user) => {
    const existing = (get().membersByProject[projectId] ?? []).find(
      (m) => m.userId === user.id && ['pending', 'active', 'invited'].includes(m.membershipStatus),
    );
    if (existing) return 'exists';

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: user.id,
        role: 'Contributor',
        membership_status: 'pending',
      });
      if (error && !`${error.message}`.includes('duplicate')) throw error;
      await get().loadMembers(projectId);
      return 'requested';
    }

    const member: ProjectMember = {
      id: localId('local-pm'),
      projectId,
      userId: user.id,
      role: 'Contributor',
      membershipStatus: 'pending',
      joinedAt: new Date().toISOString(),
      displayName: user.name,
      profilePhotoUrl: user.photoUrl ?? null,
    };
    await upsertLocal(set, get, projectId, member);
    return 'requested';
  },

  inviteBuilder: async (projectId, builder, role) => {
    const existing = (get().membersByProject[projectId] ?? []).find(
      (m) => m.userId === builder.id && m.membershipStatus !== 'removed' && m.membershipStatus !== 'declined',
    );
    if (existing) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: builder.id,
        role,
        membership_status: 'invited',
      });
      if (error && !`${error.message}`.includes('duplicate')) throw error;
      await get().loadMembers(projectId);
      return;
    }

    const member: ProjectMember = {
      id: localId('local-pm'),
      projectId,
      userId: builder.id,
      role,
      membershipStatus: 'invited',
      joinedAt: new Date().toISOString(),
      displayName: builder.name,
      profilePhotoUrl: builder.photoUrl ?? null,
    };
    await upsertLocal(set, get, projectId, member);
  },

  respondToRequest: async (projectId, memberId, accept) => {
    await patchMember(set, get, projectId, memberId, {
      membershipStatus: accept ? 'active' : 'declined',
    });
  },

  acceptInvite: async (projectId, memberId) => {
    await patchMember(set, get, projectId, memberId, { membershipStatus: 'active' });
  },

  declineInvite: async (projectId, memberId) => {
    await patchMember(set, get, projectId, memberId, { membershipStatus: 'declined' });
  },

  updateRole: async (projectId, memberId, role) => {
    const members = get().membersByProject[projectId] ?? [];
    const target = members.find((m) => m.id === memberId);
    if (target && target.role === 'Owner' && role !== 'Owner' && isLastActiveOwner(members, target)) {
      throw new Error('Cannot demote the last owner');
    }
    await patchMember(set, get, projectId, memberId, { role });
  },

  removeMember: async (projectId, memberId) => {
    const members = get().membersByProject[projectId] ?? [];
    const target = members.find((m) => m.id === memberId);
    if (target && isLastActiveOwner(members, target)) {
      throw new Error('Cannot remove the last owner');
    }
    await patchMember(set, get, projectId, memberId, { membershipStatus: 'removed' });
  },

  activeMembers: (projectId) =>
    (get().membersByProject[projectId] ?? []).filter((m) => m.membershipStatus === 'active'),

  myMembership: (projectId, userId) =>
    (get().membersByProject[projectId] ?? []).find((m) => m.userId === userId),
}));

// --- helpers ---------------------------------------------------------------
async function upsertLocal(
  set: (fn: (s: MembershipState) => Partial<MembershipState>) => void,
  get: () => MembershipState,
  projectId: string,
  member: ProjectMember,
) {
  const next = [...(get().membersByProject[projectId] ?? []), member];
  set((s) => ({ membersByProject: { ...s.membersByProject, [projectId]: next } }));
  const map = await loadMap();
  map[projectId] = next;
  await saveMap(map);
}

async function patchMember(
  set: (fn: (s: MembershipState) => Partial<MembershipState>) => void,
  get: () => MembershipState,
  projectId: string,
  memberId: string,
  patch: Partial<Pick<ProjectMember, 'role' | 'membershipStatus'>>,
) {
  const next = (get().membersByProject[projectId] ?? []).map((m) =>
    m.id === memberId ? { ...m, ...patch } : m,
  );
  set((s) => ({ membersByProject: { ...s.membersByProject, [projectId]: next } }));

  if (isSupabaseConfigured) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.role !== undefined) dbPatch.role = patch.role;
    if (patch.membershipStatus !== undefined) dbPatch.membership_status = patch.membershipStatus;
    await supabase.from('project_members').update(dbPatch).eq('id', memberId);
    return;
  }
  const map = await loadMap();
  map[projectId] = next;
  await saveMap(map);
}

export type { MembershipStatus };
