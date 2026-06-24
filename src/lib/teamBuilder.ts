/**
 * Forge AI Team Builder — project-specific team formation.
 *
 * Unlike the general matching engine (which finds good people for a person),
 * this analyzes a single project: what skills/roles it has, what it is missing,
 * the resulting execution risks, and which builders best close those gaps.
 *
 * It reuses the V1 matching engine for scoring (see lib/matching.ts) and stays
 * pure/deterministic so it works identically in demo and Supabase modes.
 */

import { calculateMatchScore, matchReasons, type ProjectContext } from '@/lib/matching';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import type { BuilderArchetype, ProjectStage } from '@/lib/constants';
import type { BuilderMatch } from '@/types/matching';
import type { ProjectMember } from '@/types/project';
import type {
  MissingRole,
  MissingSkill,
  Priority,
  RecommendedBuilder,
  TeamAnalysis,
  TeamMemberSummary,
  TeamRisk,
} from '@/types/teamBuilder';

/** Role label + the skills each archetype typically brings to a team. */
const ARCHETYPE_ROLE: Record<BuilderArchetype, { role: string; skills: string[]; capability: string }> = {
  Visionary: { role: 'Product Lead', skills: ['Product Management'], capability: 'product direction' },
  Builder: {
    role: 'Engineer',
    skills: ['Software Engineering', 'Frontend Engineering', 'Backend Engineering', 'Mobile Engineering', 'AI'],
    capability: 'engineering',
  },
  Operator: { role: 'Operations Lead', skills: ['Operations', 'Finance'], capability: 'operations' },
  Designer: { role: 'Product Designer', skills: ['Design'], capability: 'design' },
  Seller: { role: 'Sales Lead', skills: ['Sales'], capability: 'sales' },
  Marketer: { role: 'Growth Marketer', skills: ['Marketing', 'Growth'], capability: 'growth' },
  Analyst: { role: 'Data Analyst', skills: ['Data Science'], capability: 'data' },
};

/** Which archetypes matter most at each project stage. Mirrors lib/matching. */
const STAGE_NEEDS: Record<ProjectStage, BuilderArchetype[]> = {
  Idea: ['Visionary', 'Designer', 'Analyst'],
  Validation: ['Analyst', 'Designer', 'Builder'],
  Prototype: ['Builder', 'Designer'],
  MVP: ['Builder', 'Designer', 'Operator'],
  Launch: ['Marketer', 'Seller', 'Operator'],
  Growth: ['Operator', 'Seller', 'Marketer'],
  Revenue: ['Operator', 'Seller'],
};

/** Skills typically required to make progress at each stage. */
const STAGE_SKILLS: Record<ProjectStage, string[]> = {
  Idea: ['Product Management', 'Design'],
  Validation: ['Product Management', 'Data Science'],
  Prototype: ['Software Engineering', 'Design'],
  MVP: ['Software Engineering', 'Design', 'Product Management'],
  Launch: ['Marketing', 'Growth', 'Sales'],
  Growth: ['Growth', 'Marketing', 'Operations'],
  Revenue: ['Sales', 'Finance', 'Operations'],
};

const STAGE_ORDER: ProjectStage[] = [
  'Idea',
  'Validation',
  'Prototype',
  'MVP',
  'Launch',
  'Growth',
  'Revenue',
];

function normalizeStage(stage?: string | null): ProjectStage {
  const found = STAGE_ORDER.find((s) => s === stage);
  return found ?? 'Idea';
}

function stageAtLeast(stage: ProjectStage, min: ProjectStage): boolean {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(min);
}

function lower(arr: string[]): Set<string> {
  return new Set(arr.map((s) => s.toLowerCase()));
}

export interface TeamBuilderInput {
  project: { description?: string | null; stage?: string | null; skillsNeeded?: string[] };
  /** Active project members only. */
  members: ProjectMember[];
  ownerId?: string | null;
  ownerArchetype?: BuilderArchetype | null;
  /** Candidate pool. Defaults to demo builders. */
  candidates?: BuilderMatch[];
  /** User IDs to exclude (e.g. declined/removed in Supabase). */
  excludeUserIds?: string[];
}

export function analyzeTeam(input: TeamBuilderInput): TeamAnalysis {
  const { members, ownerId, ownerArchetype } = input;
  const candidates = input.candidates ?? SAMPLE_BUILDERS;
  const excluded = new Set(input.excludeUserIds ?? []);
  const stage = normalizeStage(input.project.stage);

  const builderById = new Map(candidates.map((b) => [b.userId, b]));

  // --- Current team --------------------------------------------------------
  const currentTeam: TeamMemberSummary[] = [];
  const currentSkills = new Set<string>();
  const currentArchetypes: BuilderArchetype[] = [];

  members.forEach((m) => {
    const isYou = m.userId === ownerId;
    const known = builderById.get(m.userId);
    const archetype: BuilderArchetype | null =
      (known?.archetype as BuilderArchetype | undefined) ?? (isYou ? ownerArchetype ?? null : null);
    const role =
      known?.occupation ?? (archetype ? ARCHETYPE_ROLE[archetype].role : 'Builder');

    currentTeam.push({
      userId: m.userId,
      name: m.displayName ?? known?.displayName ?? 'Builder',
      role,
      archetype,
      photoUrl: m.profilePhotoUrl ?? known?.profilePhotoUrl ?? null,
      isYou,
    });

    known?.skills.forEach((s) => currentSkills.add(s));
    if (archetype) currentArchetypes.push(archetype);
  });

  const haveSkills = lower([...currentSkills]);
  const haveArchetypes = new Set(currentArchetypes);

  // --- Missing skills ------------------------------------------------------
  const explicit = input.project.skillsNeeded ?? [];
  const explicitLower = lower(explicit);
  const stageSkills = STAGE_SKILLS[stage];

  const missingSkillMap = new Map<string, MissingSkill>();
  [...explicit, ...stageSkills].forEach((skill) => {
    const key = skill.toLowerCase();
    if (haveSkills.has(key) || missingSkillMap.has(key)) return;
    missingSkillMap.set(key, {
      skill,
      priority: explicitLower.has(key) ? 'High' : 'Medium',
    });
  });
  const missingSkills = [...missingSkillMap.values()];

  // --- Missing roles -------------------------------------------------------
  const needed = STAGE_NEEDS[stage];
  const missingRoles: MissingRole[] = needed
    .filter((arch) => !haveArchetypes.has(arch))
    .map((arch, i) => {
      const meta = ARCHETYPE_ROLE[arch];
      return {
        role: meta.role,
        archetype: arch,
        // The top-needed archetype for the stage is the most critical.
        priority: (i === 0 ? 'High' : 'Medium') as Priority,
        reason: `Adds missing ${meta.capability} capability for the ${stage} stage`,
      };
    });

  // --- Risk factors --------------------------------------------------------
  const risks: TeamRisk[] = [];
  const hasArch = (a: BuilderArchetype) => haveArchetypes.has(a);
  const hasSkill = (s: string) => haveSkills.has(s.toLowerCase());

  if (!hasArch('Designer') && !hasSkill('Design')) {
    risks.push({ id: 'design', label: 'No design capability', severity: stageAtLeast(stage, 'Prototype') ? 'High' : 'Medium' });
  }
  if (!hasArch('Builder') && !hasSkill('Software Engineering') && stageAtLeast(stage, 'Prototype')) {
    risks.push({ id: 'eng', label: 'No engineering capability', severity: 'High' });
  }
  if (!hasArch('Marketer') && !hasArch('Seller') && stageAtLeast(stage, 'MVP')) {
    risks.push({ id: 'growth', label: 'No growth capability', severity: stageAtLeast(stage, 'Launch') ? 'High' : 'Medium' });
  }
  if (!hasArch('Operator') && stageAtLeast(stage, 'MVP')) {
    risks.push({ id: 'ops', label: 'No operations capability', severity: 'Medium' });
  }
  if (currentTeam.length <= 1) {
    risks.push({ id: 'solo', label: 'Single builder — execution risk if blocked', severity: 'Medium' });
  }

  // --- Recommendations -----------------------------------------------------
  const memberIds = new Set(members.map((m) => m.userId));
  const missingRoleArchetypes = new Set(missingRoles.map((r) => r.archetype));
  const ctx: ProjectContext = {
    stage,
    skillsNeeded: missingSkills.map((m) => m.skill),
    teamArchetypes: currentArchetypes,
    interests: [],
  };

  const recommendations: RecommendedBuilder[] = candidates
    .filter((b) => !memberIds.has(b.userId) && !excluded.has(b.userId))
    .map((b) => {
      const archetype = (b.archetype as BuilderArchetype | null) ?? null;
      const breakdown = calculateMatchScore({
        builder: { archetype, skills: b.skills, interests: [], buildStage: null, availability: null },
        project: ctx,
      });
      return {
        userId: b.userId,
        displayName: b.displayName,
        occupation: b.occupation,
        archetype,
        buildStage: b.buildStage,
        profilePhotoUrl: b.profilePhotoUrl,
        skills: b.skills,
        matchScore: breakdown.total,
        reason: primaryReason(b, archetype, missingRoleArchetypes, missingSkills, ctx, breakdown),
        reasons: matchReasons(
          breakdown,
          { archetype, skills: b.skills, interests: [] },
          ctx,
        ),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  const recommendedNextRole =
    missingRoles.find((r) => r.priority === 'High') ?? missingRoles[0] ?? null;
  const criticalRoleCount = missingRoles.filter((r) => r.priority === 'High').length;

  return {
    currentTeam,
    currentSkills: [...currentSkills],
    currentArchetypes,
    missingSkills,
    missingRoles,
    risks,
    recommendations,
    recommendedNextRole,
    criticalRoleCount,
  };
}

function primaryReason(
  b: BuilderMatch,
  archetype: BuilderArchetype | null,
  missingRoleArchetypes: Set<BuilderArchetype>,
  missingSkills: MissingSkill[],
  ctx: ProjectContext,
  breakdown: { total: number },
): string {
  if (archetype && missingRoleArchetypes.has(archetype)) {
    return `Completes missing ${ARCHETYPE_ROLE[archetype].capability} capability`;
  }
  const covered = b.skills.find((s) =>
    missingSkills.some((m) => m.skill.toLowerCase() === s.toLowerCase()),
  );
  if (covered) return `Covers needed skill: ${covered}`;
  if (ctx.stage && (archetype === 'Marketer' || archetype === 'Seller')) {
    return 'Supports launch readiness';
  }
  if (breakdown.total >= 70) return 'Strong overall fit for this project';
  return 'Adds bench strength to the team';
}

/**
 * Builds the candidate pool. Demo mode returns sample builders; Supabase mode
 * queries public profiles and their skills. Current/declined/removed members
 * are excluded by the caller via `analyzeTeam`'s exclude list.
 */
export async function fetchCandidateBuilders(): Promise<BuilderMatch[]> {
  if (!isSupabaseConfigured) return SAMPLE_BUILDERS;
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, occupation, builder_archetype, build_stage, profile_photo_url, profile_visibility')
      .eq('profile_visibility', 'public')
      .limit(50);
    const rows = (users ?? []) as any[];
    // Live mode must only ever surface real builders. When there aren't enough
    // public profiles yet, return an empty pool (the UI shows an empty state)
    // rather than leaking sample/demo builders as if they were real users.
    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    const skillsByUser = new Map<string, string[]>();
    const { data: skills } = await supabase
      .from('user_skills')
      .select('user_id, skill_name')
      .in('user_id', ids);
    (skills ?? []).forEach((s: any) => {
      const list = skillsByUser.get(s.user_id) ?? [];
      list.push(s.skill_name);
      skillsByUser.set(s.user_id, list);
    });

    return rows.map((r) => ({
      userId: r.id,
      displayName:
        r.display_name || [r.first_name, r.last_name].filter(Boolean).join(' ') || 'Builder',
      occupation: r.occupation ?? null,
      archetype: r.builder_archetype ?? null,
      buildStage: r.build_stage ?? null,
      profilePhotoUrl: r.profile_photo_url ?? null,
      skills: skillsByUser.get(r.id) ?? [],
      matchScore: 0,
      reasons: [],
    }));
  } catch {
    // Never fall back to sample builders in live mode.
    return [];
  }
}
