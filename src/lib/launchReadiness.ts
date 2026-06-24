/**
 * Forge Launch Readiness Engine.
 *
 * Scores how prepared a project is to launch and surfaces the specific gaps,
 * strengths, risks, and the single highest-leverage next action. Pure and
 * deterministic — it reads only data the app already has (project, milestones,
 * tasks, the Team Builder analysis, and the latest roadmap), so it behaves the
 * same offline (demo) and on Supabase.
 */

import type { ProjectStage } from '@/lib/constants';
import type { Milestone, Project, Task } from '@/types/project';
import type { StoredRoadmap } from '@/types/ai';
import type { TeamAnalysis } from '@/types/teamBuilder';
import type {
  LaunchReadinessAnalysis,
  LaunchReadinessChecklistItem,
  LaunchReadinessGap,
  LaunchReadinessRisk,
  ReadinessStatus,
} from '@/types/launchReadiness';

const STAGE_READINESS: Record<ProjectStage, number> = {
  Idea: 0.1,
  Validation: 0.25,
  Prototype: 0.45,
  MVP: 0.65,
  Launch: 0.9,
  Growth: 1,
  Revenue: 1,
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
  return STAGE_ORDER.find((s) => s === stage) ?? 'Idea';
}

function stageAtLeast(stage: ProjectStage, min: ProjectStage) {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(min);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

const TARGET_USER_HINTS = ['for ', 'users', 'customers', 'people', 'teams', 'students', 'freelancers'];

export function analyzeLaunchReadiness(
  project: Pick<Project, 'description' | 'stage' | 'launchStatus'>,
  milestones: Milestone[],
  tasks: Task[],
  teamAnalysis: TeamAnalysis | null,
  latestRoadmap: StoredRoadmap | null,
): LaunchReadinessAnalysis {
  const stage = normalizeStage(project.stage);
  const description = project.description?.trim() ?? '';

  // --- Derived facts -------------------------------------------------------
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const milestoneRatio = totalMilestones ? completedMilestones / totalMilestones : 0;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
  const blockedRatio = totalTasks ? blockedTasks / totalTasks : 0;
  const doneTaskRatio = totalTasks ? doneTasks / totalTasks : 0;

  const hasRoadmap = !!latestRoadmap;
  const criticalRoleCount = teamAnalysis?.criticalRoleCount ?? 0;
  const teamSize = teamAnalysis?.currentTeam.length ?? 0;

  const problemDefined = description.length >= 40;
  const targetUserIdentified =
    description.length >= 30 &&
    TARGET_USER_HINTS.some((h) => description.toLowerCase().includes(h));
  const mvpExists = stageAtLeast(stage, 'Prototype');
  const launched = project.launchStatus === 'launched';

  // --- Scoring factors (weights sum to 100) --------------------------------
  const teamCompleteness = teamAnalysis
    ? criticalRoleCount === 0
      ? 1
      : clamp01(1 - criticalRoleCount * 0.5)
    : 0.5;

  const taskExecution = totalTasks ? clamp01(doneTaskRatio * 0.5 + (1 - blockedRatio) * 0.5) : 0.3;

  const validationReadiness =
    (problemDefined ? 0.5 : 0) + (stageAtLeast(stage, 'Validation') ? 0.5 : 0);

  const launchAssets =
    (mvpExists ? 0.4 : 0) +
    (launched ? 0.3 : 0) +
    (stageAtLeast(stage, 'Launch') ? 0.3 : 0);

  const factors: { score: number; weight: number }[] = [
    { score: teamCompleteness, weight: 20 },
    { score: milestoneRatio, weight: 20 },
    { score: taskExecution, weight: 10 },
    { score: hasRoadmap ? 1 : 0, weight: 10 },
    { score: STAGE_READINESS[stage], weight: 15 },
    { score: validationReadiness, weight: 10 },
    { score: clamp01(launchAssets), weight: 15 },
  ];

  const readinessScore = Math.round(
    factors.reduce((sum, f) => sum + clamp01(f.score) * f.weight, 0),
  );

  const readinessStatus: ReadinessStatus =
    readinessScore >= 75 ? 'ready' : readinessScore >= 40 ? 'getting_close' : 'not_ready';

  // --- Checklist -----------------------------------------------------------
  const checklist: LaunchReadinessChecklistItem[] = [
    {
      id: 'problem',
      label: 'Problem clearly defined',
      done: problemDefined,
      hint: 'Add a clear description of the problem you solve.',
    },
    {
      id: 'target_user',
      label: 'Target user identified',
      done: targetUserIdentified,
      hint: 'Describe who this is for in the project description.',
    },
    {
      id: 'roadmap',
      label: 'Roadmap created',
      done: hasRoadmap,
      hint: 'Generate an AI roadmap to plan your path.',
    },
    {
      id: 'milestones',
      label: 'Milestones completed',
      done: totalMilestones > 0 && milestoneRatio >= 0.6,
      hint: 'Complete the majority of your milestones.',
    },
    {
      id: 'roles',
      label: 'Critical team roles filled',
      done: !!teamAnalysis && criticalRoleCount === 0,
      hint: 'Use Team Builder to fill missing critical roles.',
    },
    {
      id: 'mvp',
      label: 'MVP / prototype exists',
      done: mvpExists,
      hint: 'Advance the project to at least the Prototype stage.',
    },
    {
      id: 'landing',
      label: 'Landing page or website URL ready',
      done: launched,
      hint: 'Prepare a public landing page for your launch.',
    },
    {
      id: 'feedback',
      label: 'Initial user feedback collected',
      done: stageAtLeast(stage, 'Launch'),
      hint: 'Gather feedback from early users before launching.',
    },
    {
      id: 'story',
      label: 'Launch story drafted',
      done: launched,
      hint: 'Write the story of what you built and why.',
    },
  ];

  // --- Strengths -----------------------------------------------------------
  const strengths: string[] = [];
  if (teamAnalysis && criticalRoleCount === 0 && teamSize > 1) strengths.push('Core team roles are filled');
  if (hasRoadmap) strengths.push('A roadmap is guiding execution');
  if (totalMilestones > 0 && milestoneRatio >= 0.6) strengths.push('Strong milestone progress');
  if (mvpExists) strengths.push('A working prototype or MVP exists');
  if (problemDefined && targetUserIdentified) strengths.push('Problem and target user are clearly defined');
  if (totalTasks > 0 && blockedTasks === 0) strengths.push('No blocked tasks');

  // --- Gaps (missing launch items) ----------------------------------------
  const missingLaunchItems: LaunchReadinessGap[] = checklist
    .filter((c) => !c.done)
    .map((c) => ({ id: c.id, label: c.label, detail: c.hint ?? '' }));

  // --- Risks ---------------------------------------------------------------
  const risks: LaunchReadinessRisk[] = [];
  if (criticalRoleCount > 0) {
    risks.push({
      id: 'roles',
      label: `Missing ${criticalRoleCount} critical team role${criticalRoleCount === 1 ? '' : 's'}`,
      severity: 'High',
    });
  }
  if (blockedTasks > 0) {
    risks.push({
      id: 'blocked',
      label: `${blockedTasks} blocked task${blockedTasks === 1 ? '' : 's'} stalling progress`,
      severity: blockedRatio >= 0.3 ? 'High' : 'Medium',
    });
  }
  if (!hasRoadmap) {
    risks.push({ id: 'roadmap', label: 'No roadmap to guide the launch', severity: 'Medium' });
  }
  if (totalMilestones === 0) {
    risks.push({ id: 'milestones', label: 'No milestones defined yet', severity: 'Medium' });
  }
  if (!mvpExists) {
    risks.push({ id: 'mvp', label: 'Project is still pre-prototype', severity: 'Medium' });
  }
  if (teamSize <= 1) {
    risks.push({ id: 'solo', label: 'Single builder — execution risk if blocked', severity: 'Low' });
  }

  // --- Recommended next action --------------------------------------------
  const recommendedNextAction = nextAction({
    criticalRoleCount,
    nextRole: teamAnalysis?.recommendedNextRole?.role ?? null,
    hasRoadmap,
    totalMilestones,
    milestoneRatio,
    blockedTasks,
    mvpExists,
    problemDefined,
    readinessStatus,
  });

  return {
    readinessScore,
    readinessStatus,
    missingLaunchItems,
    strengths,
    risks,
    recommendedNextAction,
    checklist,
  };
}

function nextAction(ctx: {
  criticalRoleCount: number;
  nextRole: string | null;
  hasRoadmap: boolean;
  totalMilestones: number;
  milestoneRatio: number;
  blockedTasks: number;
  mvpExists: boolean;
  problemDefined: boolean;
  readinessStatus: ReadinessStatus;
}): string {
  if (!ctx.problemDefined) return 'Clarify the problem and target user in your project description.';
  if (ctx.criticalRoleCount > 0) {
    return ctx.nextRole
      ? `Fill the ${ctx.nextRole} role using Team Builder.`
      : 'Fill your missing critical team roles using Team Builder.';
  }
  if (!ctx.hasRoadmap) return 'Generate an AI roadmap to plan your path to launch.';
  if (ctx.blockedTasks > 0)
    return `Unblock your ${ctx.blockedTasks} blocked task${ctx.blockedTasks === 1 ? '' : 's'}.`;
  if (ctx.totalMilestones === 0) return 'Define milestones to structure your path to launch.';
  if (ctx.milestoneRatio < 0.6) return 'Complete your remaining milestones.';
  if (!ctx.mvpExists) return 'Build your MVP or prototype.';
  if (ctx.readinessStatus === 'ready') return 'Draft your launch story and prepare your landing page.';
  return 'Collect initial user feedback before publishing.';
}
