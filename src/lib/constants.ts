/**
 * Canonical Forge domain constants.
 *
 * These mirror the seeded lookup tables in Supabase (see
 * supabase/migrations) and the definitions in docs/04_Matching_Engine.md and
 * docs/03_User_Experience.md. Keep this in sync with the seed migration.
 */

export const NEW_USER_STATUS = 'Unproven Builder';

/** Reliability has no earned value for new users. Default is neutral. */
export const DEFAULT_RELIABILITY_SCORE = 70;

export type BuilderArchetype =
  | 'Visionary'
  | 'Builder'
  | 'Operator'
  | 'Designer'
  | 'Seller'
  | 'Marketer'
  | 'Analyst';

export const BUILDER_ARCHETYPES: {
  key: BuilderArchetype;
  description: string;
}[] = [
  { key: 'Visionary', description: 'Generates ideas and sets direction.' },
  { key: 'Builder', description: 'Designs and builds the product.' },
  { key: 'Operator', description: 'Organizes execution and keeps teams moving.' },
  { key: 'Designer', description: 'Crafts the experience and interface.' },
  { key: 'Seller', description: 'Drives revenue and closes deals.' },
  { key: 'Marketer', description: 'Grows reach and acquires users.' },
  { key: 'Analyst', description: 'Validates opportunities with data.' },
];

export type PersonalBuildStage =
  | 'Explorer'
  | 'Idea'
  | 'Validation'
  | 'Building'
  | 'Launch'
  | 'Growth'
  | 'Business';

export const PERSONAL_BUILD_STAGES: {
  key: PersonalBuildStage;
  description: string;
  color: string;
}[] = [
  { key: 'Explorer', description: 'Interested in building. No active idea.', color: '#94A3B8' },
  { key: 'Idea', description: 'Has one or more ideas. Needs validation.', color: '#3B82F6' },
  { key: 'Validation', description: 'Testing opportunities.', color: '#8B5CF6' },
  { key: 'Building', description: 'Actively creating.', color: '#6366F1' },
  { key: 'Launch', description: 'Preparing release.', color: '#10B981' },
  { key: 'Growth', description: 'Has users. Needs traction.', color: '#F59E0B' },
  { key: 'Business', description: 'Generating revenue.', color: '#D4AF37' },
];

export type ProjectStage =
  | 'Idea'
  | 'Validation'
  | 'Prototype'
  | 'MVP'
  | 'Launch'
  | 'Growth'
  | 'Revenue';

export const PROJECT_STAGES: {
  key: ProjectStage;
  description: string;
  color: string;
}[] = [
  { key: 'Idea', description: 'Concept only.', color: '#3B82F6' },
  { key: 'Validation', description: 'Market testing.', color: '#8B5CF6' },
  { key: 'Prototype', description: 'Initial version exists.', color: '#6366F1' },
  { key: 'MVP', description: 'Working product.', color: '#4F46E5' },
  { key: 'Launch', description: 'Preparing public release.', color: '#10B981' },
  { key: 'Growth', description: 'Acquiring users.', color: '#F59E0B' },
  { key: 'Revenue', description: 'Generating revenue.', color: '#D4AF37' },
];

export type AvailabilityLevel = '1-5' | '5-10' | '10-20' | '20+';

export const AVAILABILITY_LEVELS: {
  key: AvailabilityLevel;
  label: string;
  minHours: number;
  maxHours: number | null;
}[] = [
  { key: '1-5', label: '1-5 hours / week', minHours: 1, maxHours: 5 },
  { key: '5-10', label: '5-10 hours / week', minHours: 5, maxHours: 10 },
  { key: '10-20', label: '10-20 hours / week', minHours: 10, maxHours: 20 },
  { key: '20+', label: '20+ hours / week', minHours: 20, maxHours: null },
];

export const PROFICIENCY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export type ProficiencyLevel = (typeof PROFICIENCY_LEVELS)[number];

export const SKILLS: { name: string; category: string }[] = [
  { name: 'Software Engineering', category: 'Engineering' },
  { name: 'Frontend Engineering', category: 'Engineering' },
  { name: 'Backend Engineering', category: 'Engineering' },
  { name: 'Mobile Engineering', category: 'Engineering' },
  { name: 'AI', category: 'Engineering' },
  { name: 'Data Science', category: 'Engineering' },
  { name: 'Product Management', category: 'Product' },
  { name: 'Design', category: 'Product' },
  { name: 'Marketing', category: 'Growth' },
  { name: 'Sales', category: 'Growth' },
  { name: 'Growth', category: 'Growth' },
  { name: 'Operations', category: 'Business' },
  { name: 'Finance', category: 'Business' },
];

export const INTERESTS: { name: string; category: string }[] = [
  { name: 'AI', category: 'Technology' },
  { name: 'Sports', category: 'Lifestyle' },
  { name: 'Finance', category: 'Business' },
  { name: 'Healthcare', category: 'Industry' },
  { name: 'Government', category: 'Industry' },
  { name: 'Education', category: 'Industry' },
  { name: 'Real Estate', category: 'Industry' },
  { name: 'Gaming', category: 'Technology' },
];

export const GOALS = [
  'Build a Side Hustle',
  'Launch a Startup',
  'Meet Collaborators',
  'Learn New Skills',
  'Find a Cofounder',
  'Launch First Product',
] as const;
export type Goal = (typeof GOALS)[number];

export const PROJECT_VISIBILITY = ['Public', 'Members Only', 'Invite Only', 'Anonymous'] as const;
export type ProjectVisibility = (typeof PROJECT_VISIBILITY)[number];

export const PROJECT_ROLES = ['Owner', 'Admin', 'Contributor', 'Viewer'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

/** Roles assignable via member management (Owner is implicit / not reassignable here). */
export const ASSIGNABLE_ROLES = ['Admin', 'Contributor', 'Viewer'] as const;

export const MEMBER_STATUSES: {
  key: 'active' | 'pending' | 'invited' | 'declined' | 'removed' | 'left';
  label: string;
  color: string;
}[] = [
  { key: 'active', label: 'Active', color: '#10B981' },
  { key: 'pending', label: 'Pending', color: '#F59E0B' },
  { key: 'invited', label: 'Invited', color: '#3B82F6' },
  { key: 'declined', label: 'Declined', color: '#94A3B8' },
  { key: 'removed', label: 'Removed', color: '#EF4444' },
  { key: 'left', label: 'Left', color: '#94A3B8' },
];

export const HEALTH_STATUSES = ['Healthy', 'Needs Attention', 'At Risk'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

/** Partner-preference weight dimensions ranked during onboarding. */
export const PARTNER_PREFERENCE_DIMENSIONS = [
  'reliability',
  'availability',
  'experience',
  'leadership',
  'communication',
  'technical',
] as const;
export type PartnerPreferenceDimension = (typeof PARTNER_PREFERENCE_DIMENSIONS)[number];

export const MILESTONE_STATUSES: {
  key: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  label: string;
  color: string;
}[] = [
  { key: 'not_started', label: 'Not started', color: '#94A3B8' },
  { key: 'in_progress', label: 'In progress', color: '#3B82F6' },
  { key: 'completed', label: 'Completed', color: '#10B981' },
  { key: 'blocked', label: 'Blocked', color: '#EF4444' },
];

export const TASK_STATUSES: {
  key: 'todo' | 'in_progress' | 'done' | 'blocked';
  label: string;
  color: string;
}[] = [
  { key: 'todo', label: 'To do', color: '#94A3B8' },
  { key: 'in_progress', label: 'In progress', color: '#3B82F6' },
  { key: 'done', label: 'Done', color: '#10B981' },
  { key: 'blocked', label: 'Blocked', color: '#EF4444' },
];

export const TASK_PRIORITIES: {
  key: 'low' | 'medium' | 'high';
  label: string;
  color: string;
}[] = [
  { key: 'low', label: 'Low', color: '#64748B' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'high', label: 'High', color: '#EF4444' },
];

/** Matching engine weights (V1). See docs/04_Matching_Engine.md. */
export const MATCH_WEIGHTS = {
  stageFit: 0.25,
  skillCoverage: 0.2,
  reliability: 0.15,
  interestAlignment: 0.1,
  availability: 0.1,
  compatibility: 0.1,
  experienceDiversity: 0.05,
  location: 0.05,
} as const;
