import { supabase } from '@/lib/supabase';
import { roadmapSchema } from '@/lib/validators';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { AIRoadmap, RoadmapImportResult } from '@/types/ai';

export interface RoadmapInput {
  projectId: string;
  title: string;
  description?: string | null;
  stage: string;
  skills?: string[];
  goals?: string[];
}

/**
 * Validates an unknown value against the roadmap shape. Returns a normalized
 * AIRoadmap or null when the payload is malformed, so callers can render an
 * error state instead of crashing on bad AI/JSON output.
 */
export function parseRoadmap(value: unknown): AIRoadmap | null {
  const result = roadmapSchema.safeParse(value);
  if (!result.success) return null;
  return result.data as AIRoadmap;
}

/**
 * Generates a roadmap. When Supabase is configured it invokes the
 * `create-roadmap` Edge Function (which calls the LLM and persists the row).
 * Otherwise it returns a deterministic demo roadmap. The client never calls
 * OpenAI directly. Throws on a configured-but-failed remote generation so the
 * store can decide how to fall back.
 */
export async function generateRoadmapRemote(input: RoadmapInput): Promise<AIRoadmap> {
  const { data, error } = await supabase.functions.invoke('create-roadmap', {
    body: {
      project_id: input.projectId,
      title: input.title,
      description: input.description ?? '',
      stage: input.stage,
      skills: input.skills ?? [],
      goals: input.goals ?? [],
    },
  });
  if (error) throw error;
  const parsed = parseRoadmap((data as any)?.roadmap ?? data);
  if (!parsed) throw new Error('Malformed roadmap response');
  return parsed;
}

// --- deterministic demo roadmap ------------------------------------------
type Phase = { goal: string; milestones: string[]; tasks: string[] };

const EARLY_STAGES = ['Idea', 'Validation'];
const MID_STAGES = ['Prototype', 'MVP'];

function phasesForStage(stage: string, title: string): Phase[] {
  if (EARLY_STAGES.includes(stage)) {
    return [
      {
        goal: 'Sharpen the problem and validate real demand',
        milestones: [`Problem statement for ${title} validated`],
        tasks: [
          'Write a one-sentence problem statement',
          'Interview 5 potential users about the problem',
          'Summarize the top 3 recurring pain points',
        ],
      },
      {
        goal: 'Define the smallest valuable solution',
        milestones: ['Core solution scope defined'],
        tasks: [
          'List the single job the product must do',
          'Sketch the core user flow end to end',
          'Cut every feature that is not essential',
        ],
      },
      {
        goal: 'Build a clickable prototype',
        milestones: ['Prototype of the core flow ready'],
        tasks: [
          'Create low-fidelity screens for the core flow',
          'Wire screens into a clickable prototype',
          'Prepare a 5-question feedback script',
        ],
      },
      {
        goal: 'Test with users and decide next steps',
        milestones: ['Prototype tested with 5 users'],
        tasks: [
          'Run 5 prototype walkthroughs',
          'Capture quotes and friction points',
          'Decide: persevere, pivot, or refine',
        ],
      },
    ];
  }

  if (MID_STAGES.includes(stage)) {
    return [
      {
        goal: 'Lock scope for a shippable first version',
        milestones: ['MVP scope and success metric agreed'],
        tasks: [
          `Define what "done" means for ${title} v1`,
          'Pick one metric that proves it works',
          'Break the build into weekly chunks',
        ],
      },
      {
        goal: 'Build the core experience',
        milestones: ['Core feature working end to end'],
        tasks: [
          'Implement the primary user flow',
          'Set up data persistence and auth',
          'Add basic error and empty states',
        ],
      },
      {
        goal: 'Make it usable and reliable',
        milestones: ['Polished, testable build ready'],
        tasks: [
          'Fix the top 10 usability issues',
          'Add onboarding for first-time users',
          'Write a short test plan and run it',
        ],
      },
      {
        goal: 'Ship a private beta',
        milestones: ['Beta launched to first users'],
        tasks: [
          'Invite 10 target users to the beta',
          'Instrument the key activation event',
          'Collect feedback and triage fixes',
        ],
      },
    ];
  }

  // Launch / Growth / Revenue and anything else.
  return [
    {
      goal: 'Prepare a confident public launch',
      milestones: ['Launch checklist complete'],
      tasks: [
        `Finalize the ${title} landing page and demo`,
        'Write the launch announcement',
        'Line up a list of 25 people to tell on day one',
      ],
    },
    {
      goal: 'Launch and drive first traction',
      milestones: ['Public launch shipped'],
      tasks: [
        'Ship the public release',
        'Post to relevant communities and channels',
        'Respond to every early user personally',
      ],
    },
    {
      goal: 'Turn attention into retained users',
      milestones: ['Activation and retention measured'],
      tasks: [
        'Track activation and 7-day retention',
        'Interview 5 active and 5 churned users',
        'Ship one improvement to the weakest step',
      ],
    },
    {
      goal: 'Find a repeatable growth loop',
      milestones: ['One growth channel validated'],
      tasks: [
        'Test two acquisition channels',
        'Double down on the best performer',
        'Set next month’s primary metric and target',
      ],
    },
  ];
}

function recommendedTeam(stage: string, skills: string[]) {
  const has = (kw: string) => skills.some((s) => s.toLowerCase().includes(kw));
  const team: { role: string; reason: string }[] = [];
  if (!has('engineer') && !has('software') && !has('developer')) {
    team.push({
      role: 'Technical Builder',
      reason: 'Someone who can ship the product so ideas turn into a working version.',
    });
  }
  if (!has('design')) {
    team.push({
      role: 'Product Designer',
      reason: 'To craft a clear, trustworthy experience users actually understand.',
    });
  }
  if (EARLY_STAGES.includes(stage) || MID_STAGES.includes(stage)) {
    team.push({
      role: 'Domain Expert',
      reason: 'A user or operator from your space to keep the build grounded in reality.',
    });
  } else {
    team.push({
      role: 'Growth Marketer',
      reason: 'To find and scale the channels that bring the right users in.',
    });
  }
  return team.slice(0, 3);
}

function risksForStage(stage: string): AIRoadmap['risks'] {
  const base: AIRoadmap['risks'] = [
    {
      risk: 'Building before validating demand',
      severity: 'high',
      mitigation: 'Talk to real users every week and let evidence guide scope.',
    },
    {
      risk: 'Scope creep slows momentum',
      severity: 'medium',
      mitigation: 'Protect a single weekly goal and defer everything non-essential.',
    },
  ];
  if (!EARLY_STAGES.includes(stage)) {
    base.push({
      risk: 'Launching without a way to measure success',
      severity: 'medium',
      mitigation: 'Instrument one activation metric before you ship.',
    });
  }
  return base;
}

export function buildDemoRoadmap(input: RoadmapInput): AIRoadmap {
  const stage = input.stage || 'Idea';
  const skills = input.skills ?? [];
  const goals = input.goals ?? [];
  const phases = phasesForStage(stage, input.title);

  const weeks = phases.map((p, i) => ({
    week: i + 1,
    goal: p.goal,
    milestones: p.milestones,
    tasks: p.tasks,
  }));

  const goalText = goals.length ? ` toward your goal to ${goals[0]!.toLowerCase()}` : '';
  const summary = `A focused 30-day plan to move "${input.title}" forward from the ${stage} stage${goalText}. Each week has one clear goal, concrete tasks, and a milestone that proves progress.`;

  return {
    summary,
    stage,
    recommended_team: recommendedTeam(stage, skills),
    risks: risksForStage(stage),
    weeks,
    next_action: weeks[0]?.tasks[0] ?? 'Define one concrete action you can finish this week.',
  };
}

// --- roadmap -> workspace conversion -------------------------------------
function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Converts a roadmap's weekly plan into workspace milestones and tasks using
 * the existing workspace store. Dedupes by title (case-insensitive) so adding
 * the same roadmap twice is a no-op. Tasks reference their week's milestone via
 * the description, since the task schema has no milestone foreign key.
 */
export async function importRoadmapToWorkspace(
  projectId: string,
  roadmap: AIRoadmap,
): Promise<RoadmapImportResult> {
  const store = useWorkspaceStore.getState();
  if (!store.loadedProjects[projectId]) {
    await store.loadProject(projectId);
  }

  const current = useWorkspaceStore.getState();
  const milestoneTitles = new Set(
    (current.milestonesByProject[projectId] ?? []).map((m) => m.title.trim().toLowerCase()),
  );
  const taskTitles = new Set(
    (current.tasksByProject[projectId] ?? []).map((t) => t.title.trim().toLowerCase()),
  );

  let milestonesAdded = 0;
  let tasksAdded = 0;

  for (const week of roadmap.weeks) {
    const due = addDays(week.week * 7);
    const primaryMilestone = week.milestones[0];

    for (const title of week.milestones) {
      const key = title.trim().toLowerCase();
      if (!key || milestoneTitles.has(key)) continue;
      milestoneTitles.add(key);
      await store.createMilestone(projectId, {
        title: title.trim(),
        description: `Week ${week.week}: ${week.goal}`,
        dueDate: due,
        status: 'not_started',
        completionPercentage: 0,
      });
      milestonesAdded += 1;
    }

    for (const title of week.tasks) {
      const key = title.trim().toLowerCase();
      if (!key || taskTitles.has(key)) continue;
      taskTitles.add(key);
      const ref = primaryMilestone
        ? `Milestone: ${primaryMilestone} (Week ${week.week})`
        : `Week ${week.week}: ${week.goal}`;
      await store.createTask(projectId, {
        title: title.trim(),
        description: ref,
        dueDate: due,
        status: 'todo',
        priority: 'medium',
        assignedUserId: null,
      });
      tasksAdded += 1;
    }
  }

  return { milestonesAdded, tasksAdded };
}
