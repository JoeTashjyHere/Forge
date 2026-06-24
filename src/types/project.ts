import type {
  HealthStatus,
  ProjectRole,
  ProjectStage,
  ProjectVisibility,
} from '@/lib/constants';

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  industry: string | null;
  stage: ProjectStage;
  visibility: ProjectVisibility;
  healthStatus: HealthStatus;
  timeCommitment: string | null;
  lookingForMembers: boolean;
  launchStatus: 'draft' | 'launched';
  /** Skills the project still needs. Persisted locally in demo mode. */
  skillsNeeded?: string[];
  createdAt: string;
  updatedAt: string;
}

export type MembershipStatus = 'active' | 'pending' | 'invited' | 'declined' | 'removed' | 'left';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  membershipStatus: MembershipStatus;
  joinedAt: string;
  displayName?: string | null;
  profilePhotoUrl?: string | null;
}

export interface ProjectSkillNeeded {
  id: string;
  projectId: string;
  skillName: string;
  priority: number;
  requiredLevel: string | null;
}

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: MilestoneStatus;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  assignedUserId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MilestoneInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: MilestoneStatus;
  completionPercentage: number;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedUserId?: string | null;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string | null;
  activityType: string;
  activityDescription: string;
  createdAt: string;
}
