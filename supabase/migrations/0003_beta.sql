-- Forge Beta Launch Package: invite list, feedback, and a minimal admin gate.
-- Additive migration (safe to apply after 0001/0002). See docs/12 and docs/13.

-- ---------------------------------------------------------------------------
-- Admin gate. Membership is managed out-of-band (SQL / service role); there is
-- no client write path. is_admin() backs RLS on beta tables.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Beta invite submissions (public signup form on /beta).
-- ---------------------------------------------------------------------------
create table if not exists public.beta_invites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text,                              -- role / background (freeform)
  builder_type text,                      -- builder | operator | marketer | designer | ...
  building text,                          -- what they want to build
  status text not null default 'new',     -- new | invited | onboarded | rejected
  created_at timestamptz not null default now(),
  unique (email)
);
create index if not exists idx_beta_invites_status on public.beta_invites(status);

-- ---------------------------------------------------------------------------
-- Beta feedback (lightweight survey from signed-in beta users).
-- ---------------------------------------------------------------------------
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  what_worked text,
  what_confused text,
  what_expected text,
  would_use_again boolean,
  rating int,                             -- 1..5
  created_at timestamptz not null default now()
);
create index if not exists idx_beta_feedback_created on public.beta_feedback(created_at);

-- ---------------------------------------------------------------------------
-- RLS (0002 only enabled RLS on tables that existed then; enable here too).
-- ---------------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.beta_invites enable row level security;
alter table public.beta_feedback enable row level security;

drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Anyone (including not-yet-registered visitors on /beta) may submit an invite.
drop policy if exists beta_invites_insert on public.beta_invites;
create policy beta_invites_insert on public.beta_invites for insert to anon, authenticated
  with check (true);
drop policy if exists beta_invites_select on public.beta_invites;
create policy beta_invites_select on public.beta_invites for select to authenticated
  using (public.is_admin());
drop policy if exists beta_invites_update on public.beta_invites;
create policy beta_invites_update on public.beta_invites for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Signed-in beta users submit their own feedback; only admins can read it.
drop policy if exists beta_feedback_insert on public.beta_feedback;
create policy beta_feedback_insert on public.beta_feedback for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);
drop policy if exists beta_feedback_select on public.beta_feedback;
create policy beta_feedback_select on public.beta_feedback for select to authenticated
  using (public.is_admin());
