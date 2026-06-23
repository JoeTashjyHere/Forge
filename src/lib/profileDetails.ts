import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { OnboardingData } from '@/types/user';

const DEMO_DETAILS_KEY = 'forge.demo.details';

export interface ProfileDetails {
  skills: { name: string; proficiency: string }[];
  interests: string[];
  goals: string[];
}

export async function saveDemoDetails(data: OnboardingData) {
  const details: ProfileDetails = {
    skills: data.skills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
    interests: data.interests,
    goals: data.goals,
  };
  await AsyncStorage.setItem(DEMO_DETAILS_KEY, JSON.stringify(details));
}

async function loadDemoDetails(): Promise<ProfileDetails> {
  const raw = await AsyncStorage.getItem(DEMO_DETAILS_KEY);
  return raw ? (JSON.parse(raw) as ProfileDetails) : { skills: [], interests: [], goals: [] };
}

export async function getProfileDetails(userId: string): Promise<ProfileDetails> {
  if (!isSupabaseConfigured) {
    return loadDemoDetails();
  }
  const [skills, interests, goals] = await Promise.all([
    supabase.from('user_skills').select('skill_name, proficiency_level').eq('user_id', userId),
    supabase.from('user_interests').select('interest_name').eq('user_id', userId),
    supabase.from('user_goals').select('goal_type').eq('user_id', userId),
  ]);
  return {
    skills: (skills.data ?? []).map((r: any) => ({
      name: r.skill_name,
      proficiency: r.proficiency_level,
    })),
    interests: (interests.data ?? []).map((r: any) => r.interest_name),
    goals: (goals.data ?? []).map((r: any) => r.goal_type),
  };
}
