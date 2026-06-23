# Forge Cursor Build Instructions

Version 1.0

Purpose: Give Cursor exact implementation direction to build Forge from blank
repository to MVP.

## Product Summary

Forge is a cross-platform app for iOS, Android, and Web that helps ambitious
people turn ideas into reality by finding collaborators, forming teams,
receiving AI guidance, creating projects, tracking progress, and launching
products.

Core promise: **Build What Won't Build Itself.**

Primary goal: move users from idea to momentum as quickly as possible.

---

## Required Stack

Expo, React Native, TypeScript, Expo Router, Supabase (Postgres, Auth, Realtime,
Storage, Edge Functions), OpenAI API, Anthropic API (optional), React Query,
Zustand, React Hook Form, Zod, NativeWind or Tailwind-style utilities, Vercel
(web), EAS (mobile builds).

Do not build separate native iOS and Android apps. Forge must use one shared
Expo codebase for iOS, Android, and Web.

> Implementation note for this repo: routes live under `src/app` (modern Expo
> Router convention), and the `@/*` alias maps to `src/*`. The design system is
> implemented with a typed StyleSheet theme rather than NativeWind for
> cross-platform robustness.

---

## Build Order

Build Forge in slices. Each slice must be functional before moving to the next.

1. **Project Setup** — Expo + TypeScript, Expo Router, env, Supabase client, light/dark structure. Runs on iOS, Android, Web.
2. **Supabase Setup** — Migrations for users, skills, interests, build_stages, project_stages, builder_archetypes, availability_levels; seed lookup data; enable RLS.
3. **Authentication** — Login, signup, logout, session persistence (email/password first; Google/Apple later). Route by onboarding status.
4. **Onboarding** — Basic info, skills + proficiency, interests, archetype, availability, build stage, goals, partner preferences.
5. **Home Dashboard** — AI next step, recommended builders/projects, active projects, progress summary (placeholders until matching exists).
6. **Profile** — View + edit; status *Unproven Builder*.
7. **Project Creation** — Title, description, industry, stage, visibility, skills needed, time commitment, looking-for-members. Owner becomes first member.
8. **Project Discovery** — My / Recommended / Explore projects with project cards.
9. **Project Workspace** — Overview, members, milestones, tasks, files placeholder, AI coach entry, workspace chat placeholder.
10. **Milestones and Tasks** — Create/edit/complete milestones; create/assign/update tasks.
11. **Matching Engine V1** — Rules-based weighted scoring in `lib/matching.ts` with explanations.
12. **Matches Tab** — Recommended builders, recommended projects, unexpected matches.
13. **Direct Messaging** — Conversations + messages, unread indicator, Realtime.
14. **Workspace Chat** — Project-level, members only, realtime.
15. **AI Coach Backend** — `ai-coach` edge function; client never calls OpenAI directly.
16. **AI Coach UI** — Personal + Project modes; returns answer, next step, optional tasks/roadmap.
17. **AI Roadmap Generation** — `create-roadmap` edge function; store in `ai_roadmaps`.
18. **Project Health V1** — Compute Healthy / Needs Attention / At Risk; hide raw score.
19. **Launch Marketplace V1** — Publish projects as launches with launch pages.
20. **Notifications** — In-app notification center.
21. **Security and RLS Review** — Verify ownership and membership constraints.
22. **Polish** — Loading/empty/error states, mobile + web layout, navigation.
23. **Analytics** — Track signup, onboarding complete, project created/joined, match viewed, message sent, roadmap generated, milestone completed, launch published.
24. **Beta Launch** — Production env, icons, landing page, privacy policy, terms, beta invite flow; launch to 50-100 invited users.

---

## Matching Weights (V1)

Stage Fit 25, Missing Skill Coverage 20, Reliability 15, Interest Alignment 10,
Availability Alignment 10, Compatibility 10, Experience Diversity 5, Location
Preference 5.

For MVP, reliability defaults to neutral for all new users. Do not create fake
reputation scores.

### Matching Formula Pseudocode

```ts
function calculateMatchScore(user, target, context) {
  const stageFit = calculateStageFit(user, target, context) * 0.25;
  const skillCoverage = calculateSkillCoverage(user, target, context) * 0.20;
  const reliability = calculateReliability(user, target) * 0.15;
  const interestAlignment = calculateInterestAlignment(user, target) * 0.10;
  const availability = calculateAvailabilityAlignment(user, target) * 0.10;
  const compatibility = calculateCompatibility(user, target) * 0.10;
  const experienceDiversity = calculateExperienceDiversity(user, target) * 0.05;
  const location = calculateLocationPreference(user, target) * 0.05;
  return Math.round(
    stageFit + skillCoverage + reliability + interestAlignment +
    availability + compatibility + experienceDiversity + location
  );
}
```

```ts
const DEFAULT_RELIABILITY_SCORE = 70;
const NEW_USER_STATUS = "Unproven Builder";
```

Do not display default reliability as if it were earned.

---

## AI Coach System Prompt

```
You are Forge AI Build Coach.
Your job is to help ambitious people turn ideas into reality.
You are not a generic chatbot.
You act as:
- startup advisor
- product strategist
- project manager
- accountability partner
- execution coach
Your goal is always to create momentum.
Every response should:
1. Understand the user's current build stage.
2. Provide practical guidance.
3. Identify risks or missing pieces.
4. Recommend the next concrete action.
5. Avoid vague motivational advice.
Keep responses structured, concise, and action-oriented.
Forge optimizes for:
- projects started
- teams formed
- products launched
- milestones completed
- businesses created
Do not optimize for engagement or endless conversation.
Always end with a clear next step.
```

## AI Roadmap Output Format

```json
{
  "summary": "",
  "stage": "",
  "recommended_team": [{ "role": "", "reason": "" }],
  "risks": [{ "risk": "", "severity": "", "mitigation": "" }],
  "weeks": [{ "week": 1, "goal": "", "milestones": [], "tasks": [] }],
  "next_action": ""
}
```

## Project Health Logic V1

```ts
function calculateProjectHealth(project) {
  let score = 100;
  if (noActivityIn7Days) score -= 30;
  if (noMilestones) score -= 20;
  if (overdueTasks > 3) score -= 20;
  if (teamSize < 2) score -= 15;
  if (missingCriticalSkills) score -= 15;
  if (score >= 75) return "Healthy";
  if (score >= 50) return "Needs Attention";
  return "At Risk";
}
```

---

## Database Implementation Notes

All tables need `id` UUID primary key, `created_at`, and `updated_at` where
applicable. All user-owned tables require RLS. All workspace/project tables
require membership-based RLS. Never trust client-side authorization.

---

## MVP Release Definition

Forge MVP is ready when a user can: sign up, onboard, create a profile, create a
project, discover projects, receive matches, message users, create
milestones/tasks, use the AI coach, generate a roadmap, and publish a launch —
on iOS, Android, and Web.

---

## Cursor Operating Rules

1. Read all docs first.
2. Build in slices.
3. Do not skip database security.
4. Do not invent features outside the current slice.
5. Keep code simple.
6. Prefer working product over perfect architecture.
7. Add comments where logic is business-critical.
8. Make all UI responsive for mobile and web.
9. Use TypeScript types everywhere.
10. Commit after each completed slice.

---

## Final Product Principle

Every screen should answer: *What should this user build next?*

Every feature should help users move from Idea → Team → Roadmap → Launch.

Forge is not a social network. Forge is an operating system for creation.
