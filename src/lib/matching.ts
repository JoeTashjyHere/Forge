/**
 * Forge Matching Engine — V1 (rules-based weighted scoring).
 *
 * No machine learning. See docs/04_Matching_Engine.md for the model. Reliability
 * defaults to neutral for new users and is never presented as earned.
 */

import {
  DEFAULT_RELIABILITY_SCORE,
  MATCH_WEIGHTS,
  type AvailabilityLevel,
  type BuilderArchetype,
  type PersonalBuildStage,
} from '@/lib/constants';
import type { MatchScoreBreakdown } from '@/types/matching';

export interface MatchProfile {
  buildStage?: PersonalBuildStage | null;
  archetype?: BuilderArchetype | null;
  availability?: AvailabilityLevel | null;
  skills: string[];
  interests: string[];
  location?: string | null;
  yearsExperience?: number | null;
  reliabilityScore?: number; // 0-100; defaults to neutral for new users
}

export interface ProjectContext {
  /** Project's current stage. */
  stage?: string | null;
  /** Skills the project still needs. */
  skillsNeeded: string[];
  /** Archetypes already on the team. */
  teamArchetypes: BuilderArchetype[];
  interests: string[];
}

const AVAILABILITY_ORDER: AvailabilityLevel[] = ['1-5', '5-10', '10-20', '20+'];

/** Archetype compatibility ("works well with"). See docs/04_Matching_Engine.md. */
const ARCHETYPE_AFFINITY: Record<BuilderArchetype, BuilderArchetype[]> = {
  Visionary: ['Builder', 'Operator'],
  Builder: ['Visionary', 'Designer', 'Operator'],
  Operator: ['Visionary', 'Builder'],
  Designer: ['Builder'],
  Marketer: ['Seller', 'Operator'],
  Seller: ['Marketer', 'Operator'],
  Analyst: ['Builder', 'Visionary'],
};

/** Which archetypes are most useful at each project stage. */
const STAGE_NEEDS: Record<string, BuilderArchetype[]> = {
  Idea: ['Visionary', 'Designer', 'Analyst'],
  Validation: ['Analyst', 'Designer', 'Builder'],
  Prototype: ['Builder', 'Designer'],
  MVP: ['Builder', 'Designer', 'Operator'],
  Launch: ['Marketer', 'Seller', 'Operator'],
  Growth: ['Operator', 'Seller', 'Marketer'],
  Revenue: ['Operator', 'Seller'],
};

function overlap(a: string[], b: string[]) {
  const setB = new Set(b.map((x) => x.toLowerCase()));
  return a.filter((x) => setB.has(x.toLowerCase()));
}

export function calculateStageFit(builder: MatchProfile, ctx: ProjectContext): number {
  if (!ctx.stage) return 60;
  const needs = STAGE_NEEDS[ctx.stage] ?? [];
  if (!builder.archetype) return 50;
  return needs.includes(builder.archetype) ? 100 : 45;
}

export function calculateSkillCoverage(builder: MatchProfile, ctx: ProjectContext): number {
  if (ctx.skillsNeeded.length === 0) return 60;
  const covered = overlap(builder.skills, ctx.skillsNeeded);
  return Math.min(100, Math.round((covered.length / ctx.skillsNeeded.length) * 100));
}

export function calculateInterestAlignment(builder: MatchProfile, ctx: ProjectContext): number {
  if (ctx.interests.length === 0) return 50;
  const shared = overlap(builder.interests, ctx.interests);
  return Math.min(100, 40 + shared.length * 30);
}

export function calculateAvailabilityAlignment(
  builder: MatchProfile,
  other?: AvailabilityLevel | null,
): number {
  if (!builder.availability || !other) return 60;
  const diff = Math.abs(
    AVAILABILITY_ORDER.indexOf(builder.availability) - AVAILABILITY_ORDER.indexOf(other),
  );
  return [100, 75, 50, 25][diff] ?? 25;
}

export function calculateCompatibility(builder: MatchProfile, ctx: ProjectContext): number {
  if (!builder.archetype || ctx.teamArchetypes.length === 0) return 60;
  const affinities = ARCHETYPE_AFFINITY[builder.archetype] ?? [];
  const matches = ctx.teamArchetypes.filter((a) => affinities.includes(a)).length;
  return Math.min(100, 50 + matches * 25);
}

export function calculateExperienceDiversity(builder: MatchProfile, ctx: ProjectContext): number {
  // Reward archetypes that are NOT already saturated on the team.
  if (!builder.archetype || ctx.teamArchetypes.length === 0) return 70;
  const sameCount = ctx.teamArchetypes.filter((a) => a === builder.archetype).length;
  return sameCount === 0 ? 100 : Math.max(20, 100 - sameCount * 40);
}

export function calculateLocationPreference(
  builder: MatchProfile,
  otherLocation?: string | null,
  prefersLocal?: boolean,
): number {
  if (!prefersLocal || !builder.location || !otherLocation) return 70;
  return builder.location.toLowerCase() === otherLocation.toLowerCase() ? 100 : 40;
}

export interface MatchInput {
  builder: MatchProfile;
  project: ProjectContext;
  otherAvailability?: AvailabilityLevel | null;
  otherLocation?: string | null;
  prefersLocal?: boolean;
}

export function calculateMatchScore(input: MatchInput): MatchScoreBreakdown {
  const { builder, project } = input;
  const reliability = builder.reliabilityScore ?? DEFAULT_RELIABILITY_SCORE;

  const stageFit = calculateStageFit(builder, project);
  const skillCoverage = calculateSkillCoverage(builder, project);
  const interestAlignment = calculateInterestAlignment(builder, project);
  const availability = calculateAvailabilityAlignment(builder, input.otherAvailability);
  const compatibility = calculateCompatibility(builder, project);
  const experienceDiversity = calculateExperienceDiversity(builder, project);
  const location = calculateLocationPreference(builder, input.otherLocation, input.prefersLocal);

  const total = Math.round(
    stageFit * MATCH_WEIGHTS.stageFit +
      skillCoverage * MATCH_WEIGHTS.skillCoverage +
      reliability * MATCH_WEIGHTS.reliability +
      interestAlignment * MATCH_WEIGHTS.interestAlignment +
      availability * MATCH_WEIGHTS.availability +
      compatibility * MATCH_WEIGHTS.compatibility +
      experienceDiversity * MATCH_WEIGHTS.experienceDiversity +
      location * MATCH_WEIGHTS.location,
  );

  return {
    stageFit,
    skillCoverage,
    reliability,
    interestAlignment,
    availability,
    compatibility,
    experienceDiversity,
    location,
    total,
  };
}

/** Produces up to 3 human-readable reasons for a match. */
export function matchReasons(
  breakdown: MatchScoreBreakdown,
  builder: MatchProfile,
  project: ProjectContext,
): string[] {
  const reasons: { score: number; label: string }[] = [];
  const covered = overlap(builder.skills, project.skillsNeeded);
  if (covered.length) reasons.push({ score: breakdown.skillCoverage, label: `Covers needed skills: ${covered.slice(0, 2).join(', ')}` });
  if (breakdown.stageFit >= 90) reasons.push({ score: breakdown.stageFit, label: `Strong fit for the ${project.stage} stage` });
  const sharedInterests = overlap(builder.interests, project.interests);
  if (sharedInterests.length) reasons.push({ score: breakdown.interestAlignment, label: `Shared interest in ${sharedInterests[0]}` });
  if (breakdown.availability >= 75) reasons.push({ score: breakdown.availability, label: 'Similar availability' });
  if (breakdown.compatibility >= 75) reasons.push({ score: breakdown.compatibility, label: 'Complements your team' });
  if (breakdown.experienceDiversity >= 100) reasons.push({ score: breakdown.experienceDiversity, label: 'Adds a missing perspective' });

  return reasons
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.label);
}
