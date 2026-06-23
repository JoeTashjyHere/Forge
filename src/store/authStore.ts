import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { mapProfileRow } from '@/lib/profile';
import { saveDemoDetails } from '@/lib/profileDetails';
import type { OnboardingData, UserProfile } from '@/types/user';

const DEMO_KEY = 'forge.demo.profile';
const DEMO_SESSION_KEY = 'forge.demo.session';

interface AuthState {
  initialized: boolean;
  session: Session | null;
  /** Set in demo mode to stand in for a real auth session. */
  demoUserId: string | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

function emptyProfile(id: string, email: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id,
    email,
    firstName: null,
    lastName: null,
    displayName: null,
    profilePhotoUrl: null,
    bio: null,
    occupation: null,
    company: null,
    location: null,
    timezone: null,
    yearsExperience: null,
    buildStage: null,
    builderArchetype: null,
    availability: null,
    isVerified: false,
    profileVisibility: 'public',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

async function loadDemoProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(DEMO_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

async function saveDemoProfile(profile: UserProfile) {
  await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(profile));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  session: null,
  demoUserId: null,
  profile: null,
  loading: false,
  error: null,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      const demoSession = await AsyncStorage.getItem(DEMO_SESSION_KEY);
      const profile = demoSession ? await loadDemoProfile() : null;
      set({
        initialized: true,
        demoUserId: demoSession,
        profile,
      });
      return;
    }

    const { data } = await supabase.auth.getSession();
    set({ session: data.session });
    if (data.session) {
      await get().refreshProfile();
    }
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) {
        void get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });
    set({ initialized: true });
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        const id = `demo-${Date.now()}`;
        await AsyncStorage.setItem(DEMO_SESSION_KEY, id);
        const profile = emptyProfile(id, email);
        await saveDemoProfile(profile);
        set({ demoUserId: id, profile });
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message ?? 'Sign up failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        const id = `demo-${Date.now()}`;
        await AsyncStorage.setItem(DEMO_SESSION_KEY, id);
        const existing = (await loadDemoProfile()) ?? emptyProfile(id, email);
        await saveDemoProfile(existing);
        set({ demoUserId: existing.id, profile: existing });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      set({ error: e.message ?? 'Sign in failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      set({ demoUserId: null, profile: null });
      return;
    }
    await supabase.auth.signOut();
    set({ session: null, profile: null });
  },

  refreshProfile: async () => {
    if (!isSupabaseConfigured) {
      set({ profile: await loadDemoProfile() });
      return;
    }
    const userId = get().session?.user.id;
    if (!userId) return;
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) {
      set({ error: error.message });
      return;
    }
    if (data) {
      set({ profile: mapProfileRow(data) });
    } else {
      // Profile row not yet created (first login) — create a stub.
      const email = get().session?.user.email ?? '';
      const { data: inserted } = await supabase
        .from('users')
        .insert({ id: userId, email })
        .select('*')
        .maybeSingle();
      set({ profile: inserted ? mapProfileRow(inserted) : emptyProfile(userId, email) });
    }
  },

  completeOnboarding: async (data) => {
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    const patch = {
      first_name: data.firstName,
      last_name: data.lastName,
      display_name: displayName,
      location: data.location,
      timezone: data.timezone,
      occupation: data.occupation,
      years_experience: data.yearsExperience,
      build_stage: data.buildStage,
      builder_archetype: data.archetype,
      availability: data.availability,
      onboarding_completed: true,
    };

    if (!isSupabaseConfigured) {
      const current = (await loadDemoProfile()) ?? get().profile;
      if (!current) return;
      const updated: UserProfile = {
        ...current,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName,
        location: data.location,
        timezone: data.timezone,
        occupation: data.occupation,
        yearsExperience: data.yearsExperience,
        buildStage: data.buildStage,
        builderArchetype: data.archetype,
        availability: data.availability,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };
      await saveDemoProfile(updated);
      await saveDemoDetails(data);
      set({ profile: updated });
      return;
    }

    const userId = get().session?.user.id;
    if (!userId) return;
    const { error } = await supabase.from('users').update(patch).eq('id', userId);
    if (error) throw error;

    // Replace skills, interests, goals, and partner preferences.
    await supabase.from('user_skills').delete().eq('user_id', userId);
    if (data.skills.length) {
      await supabase.from('user_skills').insert(
        data.skills.map((s) => ({
          user_id: userId,
          skill_name: s.name,
          proficiency_level: s.proficiency,
        })),
      );
    }
    await supabase.from('user_interests').delete().eq('user_id', userId);
    if (data.interests.length) {
      await supabase
        .from('user_interests')
        .insert(data.interests.map((name) => ({ user_id: userId, interest_name: name })));
    }
    await supabase.from('user_goals').delete().eq('user_id', userId);
    if (data.goals.length) {
      await supabase
        .from('user_goals')
        .insert(data.goals.map((goal_type) => ({ user_id: userId, goal_type })));
    }
    await supabase.from('partner_preferences').upsert({
      user_id: userId,
      reliability_weight: data.partnerPreferences.weights.reliability,
      availability_weight: data.partnerPreferences.weights.availability,
      experience_weight: data.partnerPreferences.weights.experience,
      leadership_weight: data.partnerPreferences.weights.leadership,
      communication_weight: data.partnerPreferences.weights.communication,
      technical_weight: data.partnerPreferences.weights.technical,
      local_preference: data.partnerPreferences.localPreference,
      preferred_team_size: data.partnerPreferences.preferredTeamSize,
      preferred_stage: data.partnerPreferences.preferredStage,
    });

    await get().refreshProfile();
  },

  updateProfile: async (patch) => {
    const current = get().profile;
    if (!current) return;
    const merged: UserProfile = { ...current, ...patch, updatedAt: new Date().toISOString() };
    set({ profile: merged });

    if (!isSupabaseConfigured) {
      await saveDemoProfile(merged);
      return;
    }
    const userId = get().session?.user.id;
    if (!userId) return;
    await supabase
      .from('users')
      .update({
        display_name: merged.displayName,
        bio: merged.bio,
        occupation: merged.occupation,
        company: merged.company,
        location: merged.location,
        build_stage: merged.buildStage,
        builder_archetype: merged.builderArchetype,
        availability: merged.availability,
        profile_visibility: merged.profileVisibility,
      })
      .eq('id', userId);
  },
}));

/** True when the user has an active session (real or demo). */
export function selectIsAuthenticated(s: AuthState) {
  return Boolean(s.session || s.demoUserId);
}
