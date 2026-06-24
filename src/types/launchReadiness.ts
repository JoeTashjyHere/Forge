export type ReadinessStatus = 'not_ready' | 'getting_close' | 'ready';
export type ReadinessSeverity = 'High' | 'Medium' | 'Low';

export interface LaunchReadinessChecklistItem {
  id: string;
  label: string;
  done: boolean;
  hint?: string;
}

export interface LaunchReadinessGap {
  id: string;
  label: string;
  detail: string;
}

export interface LaunchReadinessRisk {
  id: string;
  label: string;
  severity: ReadinessSeverity;
}

export interface LaunchReadinessAnalysis {
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  missingLaunchItems: LaunchReadinessGap[];
  strengths: string[];
  risks: LaunchReadinessRisk[];
  recommendedNextAction: string;
  checklist: LaunchReadinessChecklistItem[];
}
