import type {
  AvailabilityLevel,
  BuilderArchetype,
  Goal,
  PartnerPreferenceDimension,
  PersonalBuildStage,
  ProficiencyLevel,
} from '@/lib/constants';

export type ProfileVisibility = 'public' | 'members' | 'private';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  occupation: string | null;
  company: string | null;
  location: string | null;
  timezone: string | null;
  yearsExperience: number | null;
  buildStage: PersonalBuildStage | null;
  builderArchetype: BuilderArchetype | null;
  availability: AvailabilityLevel | null;
  isVerified: boolean;
  profileVisibility: ProfileVisibility;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillName: string;
  proficiency: ProficiencyLevel;
  yearsExperience: number | null;
}

export interface PartnerPreferences {
  userId: string;
  weights: Record<PartnerPreferenceDimension, number>;
  localPreference: 'local' | 'remote' | 'either';
  preferredTeamSize: number | null;
  preferredStage: string | null;
}

export interface OnboardingData {
  firstName: string;
  lastName: string;
  location: string;
  timezone: string;
  occupation: string;
  yearsExperience: number;
  skills: { name: string; proficiency: ProficiencyLevel }[];
  interests: string[];
  archetype: BuilderArchetype | null;
  availability: AvailabilityLevel | null;
  buildStage: PersonalBuildStage | null;
  goals: Goal[];
  partnerPreferences: {
    weights: Record<PartnerPreferenceDimension, number>;
    localPreference: 'local' | 'remote' | 'either';
    preferredTeamSize: number | null;
    preferredStage: string | null;
  };
}
