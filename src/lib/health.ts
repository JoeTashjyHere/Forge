import type { HealthStatus } from '@/lib/constants';
import type { Milestone, Task } from '@/types/project';

export interface HealthInput {
  milestones: Milestone[];
  tasks: Task[];
  teamSize: number;
  missingCriticalSkills?: boolean;
}

export interface HealthResult {
  status: HealthStatus;
  score: number;
  riskFactors: string[];
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Project Health V1. Mirrors the server logic in
 * supabase/functions/project-health and docs/11_Cursor_Build_Instructions.md.
 * Only the status label is ever shown to users — the raw score stays internal.
 */
export function calculateProjectHealth({
  milestones,
  tasks,
  teamSize,
  missingCriticalSkills,
}: HealthInput): HealthResult {
  let score = 100;
  const riskFactors: string[] = [];

  const now = Date.now();
  const items = [...milestones, ...tasks];
  const lastActivity = items.reduce(
    (max, i) => Math.max(max, new Date(i.updatedAt).getTime()),
    0,
  );
  if (items.length > 0 && now - lastActivity > WEEK_MS) {
    score -= 30;
    riskFactors.push('No activity in the last 7 days');
  }

  if (milestones.length === 0) {
    score -= 20;
    riskFactors.push('No milestones defined');
  }

  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate).getTime() < now,
  ).length;
  if (overdueTasks > 3) {
    score -= 20;
    riskFactors.push(`${overdueTasks} overdue tasks`);
  }

  if (teamSize < 2) {
    score -= 15;
    riskFactors.push('Solo project — recruit a collaborator');
  }

  if (missingCriticalSkills) {
    score -= 15;
    riskFactors.push('Missing critical skills on the team');
  }

  score = Math.max(0, Math.min(100, score));
  const status: HealthStatus =
    score >= 75 ? 'Healthy' : score >= 50 ? 'Needs Attention' : 'At Risk';

  return { status, score, riskFactors };
}

export function milestoneProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;
  const total = milestones.reduce((sum, m) => sum + (m.status === 'completed' ? 100 : m.completionPercentage), 0);
  return Math.round(total / milestones.length);
}
