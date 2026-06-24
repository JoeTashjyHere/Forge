import type { BuilderArchetype } from '@/lib/constants';
import { calculateMatchScore, matchReasons, type ProjectContext } from '@/lib/matching';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import type { BuilderMatch } from '@/types/matching';
import type { ProjectMember } from '@/types/project';

export interface TeammateRecommendations {
  recommendations: BuilderMatch[];
  missingSkills: string[];
}

function builderForUser(userId: string): BuilderMatch | undefined {
  return SAMPLE_BUILDERS.find((b) => b.userId === userId);
}

/**
 * Recommends builders for a project, accounting for the current team.
 * - Excludes builders already active on the project.
 * - Reduces "needed skills" by what active members already cover, so the
 *   missing-skills set shrinks as people join.
 * - Feeds active members' archetypes into compatibility/diversity scoring.
 */
export function recommendTeammates(
  project: { stage?: string | null; skillsNeeded?: string[] },
  activeMembers: ProjectMember[],
  candidates: BuilderMatch[] = SAMPLE_BUILDERS,
): TeammateRecommendations {
  const activeIds = new Set(activeMembers.map((m) => m.userId));

  // Skills covered by known (sample-backed) active members.
  const covered = new Set<string>();
  const teamArchetypes: BuilderArchetype[] = [];
  activeMembers.forEach((m) => {
    const b = builderForUser(m.userId);
    if (!b) return;
    b.skills.forEach((s) => covered.add(s.toLowerCase()));
    if (b.archetype) teamArchetypes.push(b.archetype as BuilderArchetype);
  });

  const needed = project.skillsNeeded ?? [];
  const missingSkills = needed.filter((s) => !covered.has(s.toLowerCase()));

  const ctx: ProjectContext = {
    stage: project.stage ?? null,
    skillsNeeded: missingSkills,
    teamArchetypes,
    interests: [],
  };

  const recommendations = candidates
    .filter((b) => !activeIds.has(b.userId))
    .map((b) => {
      const breakdown = calculateMatchScore({
        builder: {
          archetype: (b.archetype as BuilderArchetype) ?? null,
          buildStage: null,
          availability: null,
          skills: b.skills,
          interests: [],
        },
        project: ctx,
      });
      return {
        ...b,
        matchScore: breakdown.total,
        reasons: matchReasons(
          breakdown,
          { archetype: (b.archetype as BuilderArchetype) ?? null, skills: b.skills, interests: [] },
          ctx,
        ),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { recommendations, missingSkills };
}
