# 12 — Beta Launch Runbook

Operational guide to take Forge from demo-ready to live beta. Pairs with
`06_Technical_Architecture.md` (system design) and `07_Database_Schema.md`
(data model). This doc is the source of truth for **running, configuring, and
deploying** Forge.

---

## 0. Architecture in one paragraph

Forge is an Expo (React Native + React Native Web) app with a Supabase backend
(Postgres + Auth + Realtime + Edge Functions). The client talks to Postgres
directly through the Supabase JS SDK; **Row Level Security is the real
authorization boundary**. AI features run in Edge Functions so the OpenAI key
never reaches the client. When Supabase env vars are absent the app runs in
on-device **demo mode** (AsyncStorage), so the product is always explorable.

---

## 1. Run locally

```bash
npm install
cp .env.example .env        # leave blank for demo mode, or fill in for live mode
npm start                   # then press w (web), i (iOS), a (Android)
npm run web                 # web only
```

Mode is decided at startup:

- **Demo mode** — `.env` blank. Data is stored on-device. A "Demo mode" badge
  shows on the landing and profile screens.
- **Live mode** — both `EXPO_PUBLIC_SUPABASE_URL` and
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` set. A "Live" badge shows on the profile
  screen. Setting only one prints a startup warning (`validateSupabaseEnv`).

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | client `.env` / host env | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | client `.env` / host env | anon key (RLS-protected, safe to ship) |
| `OPENAI_API_KEY` | **Edge Function secret** | server-side LLM access (never client) |
| `OPENAI_MODEL` | Edge Function secret (optional) | defaults to `gpt-4o-mini` |
| `SUPABASE_SERVICE_ROLE_KEY` | local/CI only | smoke test user create/delete |

Find the URL and anon key in **Supabase Dashboard → Project Settings → API**.

---

## 2. Configure Supabase

### 2.1 Create + link the project

```bash
npm i -g supabase                      # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <your-project-ref>   # updates supabase/config.toml
```

### 2.2 Apply schema, RLS, and seed data (order matters)

Migrations run in filename order; the seed runs **after** migrations.

1. `supabase/migrations/0001_init.sql` — tables, `updated_at` triggers,
   `handle_new_user()` auth trigger, indexes.
2. `supabase/migrations/0002_rls.sql` — RLS helpers (`is_project_member`,
   `is_project_admin`, `is_conversation_member`, `is_project_public`), enables
   RLS on every table, and defines all policies.
3. `supabase/seed.sql` — lookup data only (archetypes, stages, skills,
   interests, availability). No FK ordering concerns; all `on conflict do
   nothing`, so it is safe to re-run.

Apply to the linked remote project:

```bash
supabase db push          # applies migrations in order
supabase db push --seed   # (or run seed.sql via the SQL editor / psql)
```

For a clean local DB that mirrors prod: `supabase db reset` (runs migrations
then seed automatically).

### 2.3 Setup checklist (verify before inviting users)

- [ ] **Migration order** — `0001_init` then `0002_rls` applied with no errors.
- [ ] **Seed order** — `seed.sql` ran after migrations; lookup tables populated.
- [ ] **Auth profile trigger** — sign up a throwaway user; confirm a matching
      row appears in `public.users` (created by `handle_new_user`). The smoke
      test asserts this automatically.
- [ ] **RLS with real users** — run `npm run smoke` (section 5). It verifies a
      user cannot edit another's profile, non-members can't write to private
      projects, and only owners/admins manage members/launches.
- [ ] **Auth settings** — in Dashboard → Authentication: set Site URL +
      redirect URLs to your web domain. For fast beta onboarding, consider
      disabling email confirmations (Auth → Providers → Email).

---

## 3. Deploy Edge Functions

All four functions require an authenticated caller (`verify_jwt = true` in
`supabase/config.toml`) and read OpenAI config from secrets.

```bash
# Set server-side secrets (never in the client bundle):
supabase secrets set OPENAI_API_KEY=sk-... OPENAI_MODEL=gpt-4o-mini

# Deploy:
supabase functions deploy ai-coach
supabase functions deploy create-roadmap
supabase functions deploy project-health
supabase functions deploy generate-matches
```

| Function | Purpose | Needs OpenAI | Behavior without OpenAI |
| --- | --- | --- | --- |
| `ai-coach` | Build-coach chat | yes | Returns a clear "AI not configured" message (HTTP 200) |
| `create-roadmap` | 30-day roadmap JSON | yes | Returns 503; client falls back to a deterministic demo roadmap |
| `project-health` | Health score/status | no | Works on data only |
| `generate-matches` | Candidate builders | no | Works on data only |

**OpenAI key safety:** the key is read via `Deno.env.get('OPENAI_API_KEY')`
inside the functions only. It is never imported into the client, never prefixed
with `EXPO_PUBLIC_`, and never returned in responses.

**Graceful degradation (client side):** `sendCoachMessage` catches invoke
errors and shows "I had trouble responding just now"; the roadmap store catches
function failures and serves a demo roadmap so the feature never hard-fails.

---

## 4. Deploy web (Vercel or equivalent)

The web build is a static single-page app exported to `dist/`.

```bash
npm run build:web         # expo export --platform web  ->  dist/
```

### Vercel

`vercel.json` is included and configured:

- `buildCommand`: `npx expo export --platform web`
- `outputDirectory`: `dist`
- SPA `rewrites`: all routes → `/index.html` (required for client routing)
- long-cache headers for hashed `/_expo/static/*` assets

Steps:

1. Import the repo in Vercel.
2. Add Environment Variables: `EXPO_PUBLIC_SUPABASE_URL`,
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Production + Preview).
3. Deploy. Vercel runs the build command and serves `dist/`.

### Any static host (Netlify, S3+CloudFront, etc.)

Serve `dist/` and add a SPA fallback rewrite so unknown paths return
`index.html`. Without the fallback, deep links (e.g. `/marketplace/123`) 404 on
refresh.

---

## 5. Test live mode (two real users)

Automated end-to-end RLS + happy-path check:

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_ANON_KEY=<anon> \
SUPABASE_SERVICE_ROLE_KEY=<service_role> \
npm run smoke
```

It creates two confirmed users and exercises, then cleans up:

1. signup → 2. auth profile trigger → 3. sign in → 4. onboarding/profile →
5. profile isolation (A cannot edit B) → 6. project creation →
7. join request → 8. invite accept → 9. direct messaging →
10. workspace chat → 11. roadmap persistence → 12. milestones/tasks →
13. launch publishing → 14. marketplace follow.

Exit code `0` = all passed. The service_role key is used only to create/delete
the two users; all functional steps run through the anon client so RLS is
genuinely tested.

### Manual UI pass

In a live build, walk: landing → Start Building → onboarding → create project →
generate roadmap → add roadmap to workspace → invite a second account →
message → complete a milestone → check launch readiness → publish launch →
view it in the marketplace and follow from the second account.

---

## 6. Invite first beta users

1. Confirm the setup checklist (2.3) is green and `npm run smoke` passes.
2. In Supabase Auth, decide on email confirmations:
   - **Off** (recommended for first cohort) — frictionless sign-up.
   - **On** — verify SMTP/sender is configured so confirmation emails arrive.
3. Share the web URL. Users tap **Start Building** to sign up.
4. (Optional) Pre-seed a few public demo projects/launches from a staff account
   so the marketplace and matches aren't empty for the first arrivals.
5. Keep the cohort small (50–100). Watch `analytics_events` for `signup`,
   `onboarding_completed`, `project_created`, `roadmap_generated`,
   `launch_published`, etc.

---

## 7. Known limitations (beta)

- **Matching & team builder** use V1 rules-based scoring (client-side);
  `generate-matches` is a scaffold for the future ML engine.
- **Privacy/Terms** are placeholder copy (`/legal/privacy`, `/legal/terms`) —
  replace with reviewed text before GA.
- **Web `<title>`/meta** are set at runtime (single-page output); the static
  `index.html` shows the bare app name, so non-JS crawlers see less. Switch web
  output to `static` if pre-rendered metadata is required.
- **Push notifications** are not implemented (in-app unread badges only).
- **File uploads/screenshots** for launches are placeholders (URL fields only).
- **AI cost controls** are minimal — monitor OpenAI usage; functions have no
  rate limiting yet.
- **Demo mode data is per-device** and resets if local storage is cleared.

---

## 8. Rollback

### Web
- Vercel → Deployments → select the last good deployment → **Promote to
  Production** (instant rollback). No backend change needed.

### Edge Functions
- Redeploy the previous version from a known-good commit:
  `git checkout <good-sha> -- supabase/functions/<name> && supabase functions deploy <name>`.
- Or disable a misbehaving function in the dashboard; the client degrades
  gracefully (coach shows an error, roadmap falls back to demo).

### Database
- **Additive migrations only** in beta. To revert, write a new forward
  migration (e.g. `0003_*.sql`) that undoes the change — do not edit applied
  migrations.
- Restore from a Supabase automatic backup (Dashboard → Database → Backups) for
  destructive incidents. Take a manual backup before any risky change.

### Full stop
- Remove `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` from the web host and redeploy
  to drop the app into safe demo mode while you investigate.

---

## 9. Pre-flight quick checklist

```
[ ] tsc --noEmit clean         (npm run typecheck)
[ ] expo lint clean            (npm run lint)
[ ] expo export web ok         (npm run build:web)
[ ] migrations applied (0001, 0002) + seed
[ ] auth trigger verified
[ ] 4 edge functions deployed + OPENAI_API_KEY secret set
[ ] npm run smoke passes against the live project
[ ] web env vars set on host (URL + anon key)
[ ] auth Site URL / redirects point at the web domain
```
