import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  BetaFeedback,
  BetaFeedbackInput,
  BetaInvite,
  BetaInviteInput,
  BetaInviteStatus,
} from '@/types/beta';

const FEEDBACK_KEY = 'forge.betaFeedback';

let localSeq = 0;
const localId = (p: string) => `${p}-${Date.now()}-${(localSeq += 1)}`;

export type InviteResult = 'ok' | 'exists' | 'error';

interface BetaState {
  invites: BetaInvite[];
  feedback: BetaFeedback[];
  loaded: boolean;
  submitInvite: (input: BetaInviteInput) => Promise<InviteResult>;
  submitFeedback: (input: BetaFeedbackInput, userId: string | null) => Promise<boolean>;
  loadAdminData: () => Promise<void>;
  updateInviteStatus: (id: string, status: BetaInviteStatus) => Promise<void>;
}

function mapInvite(r: any): BetaInvite {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role ?? null,
    builderType: r.builder_type ?? null,
    building: r.building ?? null,
    status: (r.status ?? 'new') as BetaInviteStatus,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function mapFeedback(r: any): BetaFeedback {
  return {
    id: r.id,
    userId: r.user_id ?? null,
    whatWorked: r.what_worked ?? null,
    whatConfused: r.what_confused ?? null,
    whatExpected: r.what_expected ?? null,
    wouldUseAgain: r.would_use_again ?? null,
    rating: r.rating ?? null,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

// A few illustrative rows so the demo admin view isn't empty. Not persisted.
const DEMO_INVITES: BetaInvite[] = [
  {
    id: 'demo-invite-1',
    name: 'Jordan Ellis',
    email: 'jordan@example.com',
    role: 'Indie hacker, ex-fintech PM',
    builderType: 'Builder',
    building: 'A tool that turns customer interviews into a prioritized backlog.',
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-invite-2',
    name: 'Priya Nair',
    email: 'priya@example.com',
    role: 'Product designer',
    builderType: 'Designer',
    building: 'A community app for accountability groups.',
    status: 'invited',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

async function loadLocalFeedback(): Promise<BetaFeedback[]> {
  const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
  return raw ? (JSON.parse(raw) as BetaFeedback[]) : [];
}

export const useBetaStore = create<BetaState>((set, get) => ({
  invites: [],
  feedback: [],
  loaded: false,

  submitInvite: async (input) => {
    if (!isSupabaseConfigured) {
      // Demo mode: success without persistence (per spec).
      return 'ok';
    }
    const { error } = await supabase.from('beta_invites').insert({
      name: input.name,
      email: input.email,
      role: input.role,
      builder_type: input.builderType,
      building: input.building,
    });
    if (!error) return 'ok';
    // Unique violation = already on the list. Treat as success-ish.
    if (error.code === '23505' || /duplicate/i.test(error.message)) return 'exists';
    return 'error';
  },

  submitFeedback: async (input, userId) => {
    if (!isSupabaseConfigured) {
      const entry: BetaFeedback = {
        id: localId('local-fb'),
        userId,
        whatWorked: input.whatWorked || null,
        whatConfused: input.whatConfused || null,
        whatExpected: input.whatExpected || null,
        wouldUseAgain: input.wouldUseAgain,
        rating: input.rating,
        createdAt: new Date().toISOString(),
      };
      const next = [entry, ...(await loadLocalFeedback())];
      await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
      set({ feedback: next });
      return true;
    }
    const { error } = await supabase.from('beta_feedback').insert({
      user_id: userId,
      what_worked: input.whatWorked || null,
      what_confused: input.whatConfused || null,
      what_expected: input.whatExpected || null,
      would_use_again: input.wouldUseAgain,
      rating: input.rating,
    });
    return !error;
  },

  loadAdminData: async () => {
    if (!isSupabaseConfigured) {
      set({ invites: DEMO_INVITES, feedback: await loadLocalFeedback(), loaded: true });
      return;
    }
    const [inv, fb] = await Promise.all([
      supabase.from('beta_invites').select('*').order('created_at', { ascending: false }),
      supabase.from('beta_feedback').select('*').order('created_at', { ascending: false }),
    ]);
    set({
      invites: (inv.data ?? []).map(mapInvite),
      feedback: (fb.data ?? []).map(mapFeedback),
      loaded: true,
    });
  },

  updateInviteStatus: async (id, status) => {
    set((s) => ({
      invites: s.invites.map((i) => (i.id === id ? { ...i, status } : i)),
    }));
    if (isSupabaseConfigured) {
      await supabase.from('beta_invites').update({ status }).eq('id', id);
    }
  },
}));
