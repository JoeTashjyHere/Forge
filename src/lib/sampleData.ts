import type { BuilderMatch, ProjectMatch } from '@/types/matching';
import type { Launch } from '@/types/launch';

/**
 * Curated sample recommendations. Used as placeholders on Home and in demo mode
 * until the live matching engine and backend are wired up.
 */
export const SAMPLE_BUILDERS: BuilderMatch[] = [
  {
    userId: 'sample-1',
    displayName: 'Maya Chen',
    occupation: 'Full-stack Engineer',
    archetype: 'Builder',
    buildStage: 'Building',
    profilePhotoUrl: null,
    skills: ['Software Engineering', 'AI', 'Backend Engineering'],
    matchScore: 92,
    reasons: ['Complements your skill set', 'Similar availability', 'Shared interest in AI'],
  },
  {
    userId: 'sample-2',
    displayName: 'Devon Carter',
    occupation: 'Growth Marketer',
    archetype: 'Marketer',
    buildStage: 'Launch',
    profilePhotoUrl: null,
    skills: ['Marketing', 'Growth', 'Sales'],
    matchScore: 87,
    reasons: ['Strong fit for launch stage', 'Fills a missing growth role'],
  },
  {
    userId: 'sample-3',
    displayName: 'Priya Nair',
    occupation: 'Product Designer',
    archetype: 'Designer',
    buildStage: 'Idea',
    profilePhotoUrl: null,
    skills: ['Design', 'Product Management'],
    matchScore: 81,
    reasons: ['Complements your skill set', 'Shared interest in Healthcare'],
  },
  {
    userId: 'sample-4',
    displayName: 'Sam Whitfield',
    occupation: 'Ops Lead',
    archetype: 'Operator',
    buildStage: 'Validation',
    profilePhotoUrl: null,
    skills: ['Operations', 'Finance'],
    matchScore: 74,
    reasons: ['Balances your team', 'Available 10-20 hrs/week'],
    isUnexpected: true,
  },
];

export const SAMPLE_PROJECTS: ProjectMatch[] = [
  {
    projectId: 'sample-p1',
    title: 'Lumen — AI study companion',
    description: 'A focused study assistant that turns notes into adaptive quizzes.',
    stage: 'MVP',
    healthStatus: 'Healthy',
    skillsNeeded: ['Design', 'Marketing'],
    teamCount: 3,
    matchScore: 90,
    reasons: ['Needs your skills', 'Active in the last 7 days'],
  },
  {
    projectId: 'sample-p2',
    title: 'Cooperative — local sports league app',
    description: 'Organize pickup leagues, schedules, and stats for community sports.',
    stage: 'Idea',
    healthStatus: 'Needs Attention',
    skillsNeeded: ['Frontend Engineering', 'Product Management'],
    teamCount: 2,
    matchScore: 83,
    reasons: ['Early stage fit', 'Shared interest in Sports'],
  },
  {
    projectId: 'sample-p3',
    title: 'Ledgerly — finance for freelancers',
    description: 'Automated bookkeeping and tax estimates for independent workers.',
    stage: 'Validation',
    healthStatus: 'Healthy',
    skillsNeeded: ['Backend Engineering', 'Sales'],
    teamCount: 4,
    matchScore: 78,
    reasons: ['Complementary stage', 'Strong founding team'],
    isUnexpected: true,
  },
];

export const SAMPLE_LAUNCHES: Launch[] = [
  {
    id: 'sample-l1',
    projectId: 'sample-p1',
    launchTitle: 'Lumen',
    launchDescription: 'An AI study companion that turns your notes into adaptive quizzes.',
    launchStory: 'Three strangers met on Forge and shipped Lumen in 6 weeks.',
    websiteUrl: 'https://example.com',
    videoUrl: null,
    launchDate: new Date().toISOString(),
    status: 'published',
    followerCount: 128,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample-l2',
    projectId: 'sample-p3',
    launchTitle: 'Ledgerly',
    launchDescription: 'Bookkeeping and tax estimates built for freelancers.',
    launchStory: 'A solo builder found a cofounder on Forge and launched in 90 days.',
    websiteUrl: 'https://example.com',
    videoUrl: null,
    launchDate: new Date().toISOString(),
    status: 'published',
    followerCount: 64,
    createdAt: new Date().toISOString(),
  },
];
