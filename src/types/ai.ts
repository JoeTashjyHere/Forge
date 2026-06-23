export type AISessionType = 'personal' | 'project';
export type AIContextType = 'general' | 'validation' | 'roadmap' | 'milestone_review' | 'launch';

export interface AIMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface AISession {
  id: string;
  userId: string;
  projectId: string | null;
  sessionType: AISessionType;
  createdAt: string;
  updatedAt: string;
}

export interface AICoachResponse {
  answer: string;
  nextAction: string;
  tasks?: { title: string; priority?: string }[];
  roadmapItems?: string[];
}

export interface RoadmapTeamRole {
  role: string;
  reason: string;
}

export interface RoadmapRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface RoadmapWeek {
  week: number;
  goal: string;
  milestones: string[];
  tasks: string[];
}

export interface AIRoadmap {
  summary: string;
  stage: string;
  recommended_team: RoadmapTeamRole[];
  risks: RoadmapRisk[];
  weeks: RoadmapWeek[];
  next_action: string;
}
