# Forge

**Build What Won't Build Itself.**

Forge helps ambitious people find the teammates, direction, accountability, and
momentum they need to turn ideas into reality. It is an operating system for
creation — not a social network. Success is measured by products launched and
businesses created, not followers or time spent.

This repo is a cross-platform app (iOS, Android, Web) built from a single Expo
codebase.

## Stack

- **Expo + React Native + TypeScript** (Expo Router)
- **Supabase** — Postgres, Auth, Realtime, Storage, Edge Functions, RLS
- **React Query** (server state) + **Zustand** (client state)
- **React Hook Form + Zod** (forms & validation)
- **OpenAI** via Supabase Edge Functions (the client never calls the LLM directly)

## Project structure

```
src/
  app/            Expo Router routes (auth, onboarding, tabs, projects, ai, ...)
  components/
    ui/           Design-system primitives (Button, Card, Input, Badge, ...)
    forge/        Product components (BuilderCard, ProjectCard, AIRecommendation, ...)
  lib/            supabase, constants, validators, matching, ai, analytics, permissions
  store/          Zustand stores (auth, onboarding, project)
  types/          Domain types
  constants/      Design tokens (theme)
supabase/
  migrations/     SQL schema + RLS policies
  functions/      Edge functions (ai-coach, create-roadmap, project-health, generate-matches)
  seed.sql        Lookup data
docs/             Product specification (vision, strategy, UX, schema, roadmap, ...)
```

## Getting started

```bash
npm install
npm run web      # or: npm run ios / npm run android
```

### Demo mode

Without Supabase credentials the app runs in **local demo mode** — accounts,
profiles, and projects are stored on-device so the full experience is
explorable offline. Sign up with any email and an 8+ character password.

### Connecting Supabase

1. Create a Supabase project.
2. Run the migrations in `supabase/migrations/` (in order) and `supabase/seed.sql`.
3. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy the edge functions and set `OPENAI_API_KEY` as a function secret to
   enable the AI Build Coach.

## Build progress

The app is being built in slices (see `docs/11_Cursor_Build_Instructions.md`).
Implemented so far: project setup, design system, Supabase schema + RLS,
authentication, onboarding, home dashboard, profiles, project creation &
workspace shell, matches, the matching engine (V1), and the AI Build Coach UI.
