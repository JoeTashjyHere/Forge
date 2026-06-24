import type { BuilderArchetype } from '@/lib/constants';

export type Priority = 'High' | 'Medium' | 'Low';

export interface TeamMemberSummary {
  userId: string;
  name: string;
  role: string;
  archetype: BuilderArchetype | null;
  photoUrl: string | null;
  isYou: boolean;
}

export interface MissingSkill {
  skill: string;
  priority: Priority;
}

export interface MissingRole {
  role: string;
  archetype: BuilderArchetype;
  priority: Priority;
  reason: string;
}

export interface TeamRisk {
  id: string;
  label: string;
  severity: Priority;
}

export interface RecommendedBuilder {
  userId: string;
  displayName: string;
  occupation: string | null;
  archetype: BuilderArchetype | null;
  buildStage: string | null;
  profilePhotoUrl: string | null;
  skills: string[];
  matchScore: number;
  reason: string;
  reasons: string[];
}

export interface TeamAnalysis {
  currentTeam: TeamMemberSummary[];
  currentSkills: string[];
  currentArchetypes: BuilderArchetype[];
  missingSkills: MissingSkill[];
  missingRoles: MissingRole[];
  risks: TeamRisk[];
  recommendations: RecommendedBuilder[];
  recommendedNextRole: MissingRole | null;
  criticalRoleCount: number;
}
