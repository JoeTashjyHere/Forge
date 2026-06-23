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

export interface AIRoadmapRecommendedTeamMember {
  role: string;
  reason: string;
}

export interface AIRoadmapRisk {
  risk: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface AIRoadmapWeek {
  week: number;
  goal: string;
  milestones: string[];
  tasks: string[];
}

export interface AIRoadmap {
  summary: string;
  stage: string;
  recommended_team: AIRoadmapRecommendedTeamMember[];
  risks: AIRoadmapRisk[];
  weeks: AIRoadmapWeek[];
  next_action: string;
}

/** A roadmap as persisted (in ai_roadmaps or on-device in demo mode). */
export interface StoredRoadmap {
  id: string;
  projectId: string;
  roadmap: AIRoadmap;
  createdAt: string;
}

export interface RoadmapImportResult {
  milestonesAdded: number;
  tasksAdded: number;
}

// Backwards-compatible aliases.
export type RoadmapTeamRole = AIRoadmapRecommendedTeamMember;
export type RoadmapRisk = AIRoadmapRisk;
export type RoadmapWeek = AIRoadmapWeek;
