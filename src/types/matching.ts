export interface MatchReason {
  label: string;
}

export interface BuilderMatch {
  userId: string;
  displayName: string;
  occupation: string | null;
  archetype: string | null;
  buildStage: string | null;
  profilePhotoUrl: string | null;
  skills: string[];
  matchScore: number;
  reasons: string[];
  isUnexpected?: boolean;
}

export interface ProjectMatch {
  projectId: string;
  title: string;
  description: string | null;
  stage: string;
  healthStatus: string;
  skillsNeeded: string[];
  teamCount: number;
  matchScore: number;
  reasons: string[];
  isUnexpected?: boolean;
}

export interface MatchScoreBreakdown {
  stageFit: number;
  skillCoverage: number;
  reliability: number;
  interestAlignment: number;
  availability: number;
  compatibility: number;
  experienceDiversity: number;
  location: number;
  total: number;
}
