import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDemoRoadmap } from '@/lib/roadmap';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { StoredRoadmap } from '@/types/ai';
import type { Launch } from '@/types/launch';
import type { WorkspaceMessage } from '@/types/messaging';
import type { Milestone, Project, Task } from '@/types/project';
import type { UserProfile } from '@/types/user';

/**
 * Seeds a curated, story-complete demo project the first time a demo user
 * finishes onboarding. This makes offline/demo mode feel intentional — a real
 * build in progress (roadmap, milestones, tasks, a teammate, team chat, and a
 * published launch) rather than an empty fallback shell.
 *
 * No-op when Supabase is configured (real data) or once already seeded.
 */
const SEED_KEY = 'forge.demo.seeded';
export const DEMO_PROJECT_ID = 'demo-project';

const PROJECTS_KEY = 'forge.projects';
const MILESTONES_KEY = 'forge.milestones';
const TASKS_KEY = 'forge.tasks';
const ROADMAPS_KEY = 'forge.roadmaps';
const LAUNCHES_KEY = 'forge.launches';
const WORKSPACE_MSGS_KEY = 'forge.workspaceMessages';

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function dateOnly(days: number): string {
  return daysFromNow(days).slice(0, 10);
}

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function seedDemoData(profile: UserProfile): Promise<void> {
  if (isSupabaseConfigured) return;
  const already = await AsyncStorage.getItem(SEED_KEY);
  if (already) return;

  const ownerId = profile.id;
  const ownerName = profile.displayName || profile.firstName || 'You';
  const teammate = SAMPLE_BUILDERS[2]; // Priya Nair — Product Designer
  const createdAt = daysFromNow(-21);
  const now = new Date().toISOString();

  // --- Project ------------------------------------------------------------
  const project: Project = {
    id: DEMO_PROJECT_ID,
    ownerId,
    title: 'Cohort — study groups that finish',
    slug: 'cohort',
    description:
      'Cohort matches learners into small accountability groups and keeps them on track to finish online courses together. Built for self-taught people who start courses but rarely finish, it turns lonely studying into a shared weekly commitment.',
    industry: 'Education',
    stage: 'MVP',
    visibility: 'Public',
    healthStatus: 'Healthy',
    timeCommitment: '10-20 hrs/week',
    lookingForMembers: true,
    launchStatus: 'launched',
    skillsNeeded: ['Design', 'Marketing'],
    createdAt,
    updatedAt: now,
  };
  const projects = await getJSON<Project[]>(PROJECTS_KEY, []);
  if (!projects.some((p) => p.id === DEMO_PROJECT_ID)) {
    await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify([project, ...projects]));
  }

  // --- Milestones ---------------------------------------------------------
  const milestones: Milestone[] = [
    {
      id: 'demo-m1',
      projectId: DEMO_PROJECT_ID,
      title: 'Problem validated with 5 learners',
      description: 'Week 1: Sharpen the problem and confirm real demand',
      dueDate: dateOnly(-14),
      status: 'completed',
      completionPercentage: 100,
      createdAt,
      updatedAt: daysFromNow(-14),
    },
    {
      id: 'demo-m2',
      projectId: DEMO_PROJECT_ID,
      title: 'Core matching flow scoped',
      description: 'Week 2: Define the smallest valuable version',
      dueDate: dateOnly(-7),
      status: 'completed',
      completionPercentage: 100,
      createdAt,
      updatedAt: daysFromNow(-7),
    },
    {
      id: 'demo-m3',
      projectId: DEMO_PROJECT_ID,
      title: 'MVP build: groups + weekly check-ins',
      description: 'Week 3: Build the core experience end to end',
      dueDate: dateOnly(4),
      status: 'in_progress',
      completionPercentage: 60,
      createdAt,
      updatedAt: now,
    },
    {
      id: 'demo-m4',
      projectId: DEMO_PROJECT_ID,
      title: 'Private beta with 10 groups',
      description: 'Week 4: Ship to first users and gather feedback',
      dueDate: dateOnly(14),
      status: 'not_started',
      completionPercentage: 0,
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const milestonesMap = await getJSON<Record<string, Milestone[]>>(MILESTONES_KEY, {});
  if (!milestonesMap[DEMO_PROJECT_ID]) {
    milestonesMap[DEMO_PROJECT_ID] = milestones;
    await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(milestonesMap));
  }

  // --- Tasks --------------------------------------------------------------
  const tasks: Task[] = [
    {
      id: 'demo-t1',
      projectId: DEMO_PROJECT_ID,
      assignedUserId: ownerId,
      title: 'Interview 5 self-taught learners',
      description: 'Milestone: Problem validated with 5 learners (Week 1)',
      priority: 'high',
      status: 'done',
      dueDate: dateOnly(-15),
      createdAt,
      updatedAt: daysFromNow(-15),
    },
    {
      id: 'demo-t2',
      projectId: DEMO_PROJECT_ID,
      assignedUserId: teammate?.userId ?? null,
      title: 'Design the group home screen',
      description: 'Milestone: MVP build: groups + weekly check-ins (Week 3)',
      priority: 'high',
      status: 'in_progress',
      dueDate: dateOnly(3),
      createdAt,
      updatedAt: now,
    },
    {
      id: 'demo-t3',
      projectId: DEMO_PROJECT_ID,
      assignedUserId: ownerId,
      title: 'Build weekly check-in reminder',
      description: 'Milestone: MVP build: groups + weekly check-ins (Week 3)',
      priority: 'medium',
      status: 'todo',
      dueDate: dateOnly(6),
      createdAt,
      updatedAt: now,
    },
    {
      id: 'demo-t4',
      projectId: DEMO_PROJECT_ID,
      assignedUserId: null,
      title: 'Draft the launch announcement',
      description: 'Milestone: Private beta with 10 groups (Week 4)',
      priority: 'low',
      status: 'todo',
      dueDate: dateOnly(12),
      createdAt,
      updatedAt: createdAt,
    },
  ];
  const tasksMap = await getJSON<Record<string, Task[]>>(TASKS_KEY, {});
  if (!tasksMap[DEMO_PROJECT_ID]) {
    tasksMap[DEMO_PROJECT_ID] = tasks;
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasksMap));
  }

  // --- Roadmap ------------------------------------------------------------
  const roadmap = buildDemoRoadmap({
    projectId: DEMO_PROJECT_ID,
    title: project.title,
    description: project.description,
    stage: project.stage,
    skills: ['Product Management', 'Design'],
    goals: ['launch a private beta'],
  });
  const storedRoadmap: StoredRoadmap = {
    id: 'demo-roadmap',
    projectId: DEMO_PROJECT_ID,
    roadmap,
    createdAt: daysFromNow(-18),
  };
  const roadmapsMap = await getJSON<Record<string, StoredRoadmap[]>>(ROADMAPS_KEY, {});
  if (!roadmapsMap[DEMO_PROJECT_ID]) {
    roadmapsMap[DEMO_PROJECT_ID] = [storedRoadmap];
    await AsyncStorage.setItem(ROADMAPS_KEY, JSON.stringify(roadmapsMap));
  }

  // --- Launch (published) -------------------------------------------------
  const launch: Launch = {
    id: 'demo-launch',
    projectId: DEMO_PROJECT_ID,
    launchTitle: 'Cohort',
    launchDescription:
      'Small accountability groups that keep you finishing the courses you start. Get matched, set a weekly goal, and finish together.',
    launchStory:
      'We kept buying courses and never finishing them. So we built Cohort: you get matched into a group of 4, commit to a weekly goal, and check in every Sunday. In our first 3 test groups, 11 of 12 people finished their course — up from almost none.',
    websiteUrl: 'https://cohort.study',
    videoUrl: null,
    launchDate: dateOnly(-2),
    status: 'published',
    followerCount: 23,
    createdAt: daysFromNow(-2),
  };
  const launchesMap = await getJSON<Record<string, Launch>>(LAUNCHES_KEY, {});
  if (!launchesMap[DEMO_PROJECT_ID]) {
    launchesMap[DEMO_PROJECT_ID] = launch;
    await AsyncStorage.setItem(LAUNCHES_KEY, JSON.stringify(launchesMap));
  }

  // --- Team chat ----------------------------------------------------------
  const messages: WorkspaceMessage[] = [
    {
      id: 'demo-wm1',
      projectId: DEMO_PROJECT_ID,
      senderId: teammate?.userId ?? 'sample-3',
      senderName: teammate?.displayName ?? 'Priya Nair',
      senderPhotoUrl: teammate?.profilePhotoUrl ?? null,
      body: 'The new group home screen is ready for review — pushed it to Figma.',
      createdAt: daysFromNow(-1),
    },
    {
      id: 'demo-wm2',
      projectId: DEMO_PROJECT_ID,
      senderId: ownerId,
      senderName: ownerName,
      senderPhotoUrl: profile.profilePhotoUrl ?? null,
      body: 'Love it. Let’s ship the weekly check-in next and open the beta to 10 groups.',
      createdAt: daysFromNow(-0.5),
    },
  ];
  const messagesMap = await getJSON<Record<string, WorkspaceMessage[]>>(WORKSPACE_MSGS_KEY, {});
  if (!messagesMap[DEMO_PROJECT_ID]) {
    messagesMap[DEMO_PROJECT_ID] = messages;
    await AsyncStorage.setItem(WORKSPACE_MSGS_KEY, JSON.stringify(messagesMap));
  }

  await AsyncStorage.setItem(SEED_KEY, '1');
}
