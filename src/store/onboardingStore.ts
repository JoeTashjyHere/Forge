import { create } from 'zustand';
import {
  PARTNER_PREFERENCE_DIMENSIONS,
  type PartnerPreferenceDimension,
} from '@/lib/constants';
import type { OnboardingData } from '@/types/user';

function defaultWeights(): Record<PartnerPreferenceDimension, number> {
  return PARTNER_PREFERENCE_DIMENSIONS.reduce(
    (acc, dim) => ({ ...acc, [dim]: 3 }),
    {} as Record<PartnerPreferenceDimension, number>,
  );
}

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  location: '',
  timezone: '',
  occupation: '',
  yearsExperience: 0,
  skills: [],
  interests: [],
  archetype: null,
  availability: null,
  buildStage: null,
  goals: [],
  partnerPreferences: {
    weights: defaultWeights(),
    localPreference: 'either',
    preferredTeamSize: null,
    preferredStage: null,
  },
};

interface OnboardingState {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: initialData,
  update: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
  reset: () => set({ data: initialData }),
}));
