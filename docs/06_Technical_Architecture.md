# Forge Technical Architecture

Version 1.0

## Product Requirements

Forge must support iOS, Android, and Web. A single codebase is preferred.

---

## Core Technology Stack

**Frontend:** Expo, React Native, TypeScript, Expo Router, React Query, Zustand,
React Hook Form.

**Backend:** Supabase, PostgreSQL, Realtime, Storage, Edge Functions, Row Level
Security.

**AI Layer:** OpenAI (primary reasoning and coaching), Anthropic (secondary
reasoning and validation). Future provider abstraction layer supported.

**Payments:** Stripe — Premium Memberships, Team Plans, Future Marketplace
Monetization.

**Hosting:** Frontend on Vercel, Backend on Supabase Cloud.

---

## Repository Structure

```
forge/
  apps/mobile-web/
  packages/ui/
  types/
  lib/
  supabase/
  docs/
```

---

## Mobile Strategy

Primary framework: Expo React Native. Benefits: single codebase (iOS, Android,
Web), faster iteration, smaller development team.

---

## Authentication

Methods: Apple Sign In, Google Sign In, Email + Password. Future: Passkeys,
Enterprise SSO.

## Authorization

Role-Based Access Control. Workspace Roles: Owner, Admin, Contributor, Viewer.
Permissions inherit from workspace membership.

---

## Database Philosophy

Source of truth: PostgreSQL. All business logic should originate from
database-backed entities. Avoid client-side authority.

## Realtime Architecture

Supabase Realtime supports Messages, Notifications, Project Updates, Activity
Feeds, Milestone Updates.

## Storage

Supabase Storage supports Profile Photos, Project Assets, Documents, Launch
Assets, Media.

---

## AI Architecture

Never call AI directly from the client.

`Client → Backend Function → AI Provider → Response`

Benefits: Security, Prompt Management, Cost Control, Analytics, Provider
Flexibility.

---

## Security Architecture

- Encryption At Rest: AES-256.
- Encryption In Transit: TLS.

### Row Level Security
Every table should use RLS. Users only access their data, authorized projects,
authorized workspaces, and authorized messages.

### Logging
Track Authentication Events, Project Events, AI Usage, Workspace Events, Launch
Events, Errors, Audit Trails.

### Analytics
Track Projects Started, Teams Formed, Products Launched, Milestones Completed,
Active Builds, AI Coach Usage.

---

## Notification Architecture

**Version 1:** In-App Notifications, Email Notifications.
**Future:** Push Notifications, SMS, Slack, Teams.

---

## Scalability Philosophy

Version 1 should optimize for Speed, Simplicity, Iteration — not hyper-scale.
Build simple systems first. Scale when usage requires it.

## Development Principles

1. Ship fast.
2. Prefer simple solutions.
3. Avoid premature optimization.
4. Use AI to accelerate development.
5. Every feature must support creation and execution.

---

## MVP Architecture Priorities

- **Phase 1:** Authentication, Profiles, Projects, Onboarding.
- **Phase 2:** Matching, Messaging, Workspaces.
- **Phase 3:** AI Coach, Project Health, Launch Marketplace.

---

## Long-Term Technical Moat

The moat is not code. The moat is data:

- **Builder Graph** — Who worked with who.
- **Project Graph** — What got built.
- **Collaboration Graph** — Who succeeds together.
- **Outcome Graph** — What launched, what generated revenue, what survived.

Over time Forge becomes uniquely capable of understanding who should build
together and what they should build. That intelligence layer becomes the
foundation of the platform's long-term advantage.
