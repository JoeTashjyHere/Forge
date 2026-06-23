-- Forge core schema (V1)
-- See docs/07_Database_Schema.md and docs/06_Technical_Architecture.md.
-- All tables use UUID primary keys and created/updated timestamps.

create extension if not exists "pgcrypto";

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lookup tables (seeded in seed.sql). Values are referenced by name elsewhere.
-- ---------------------------------------------------------------------------
create table if not exists public.builder_archetypes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table if not exists public.build_stages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  sort_order int not null default 0
);

create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  sort_order int not null default 0
);

create table if not exists public.availability_levels (
  id uuid primary key default gen_random_uuid(),
  label text unique not null,
  min_hours int,
  max_hours int
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text,
  description text
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text
);

-- ---------------------------------------------------------------------------
-- Users & profile
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  display_name text,
  profile_photo_url text,
  bio text,
  occupation text,
  company text,
  location text,
  timezone text,
  years_experience int,
  build_stage text,
  builder_archetype text,
  availability text,
  is_verified boolean not null default false,
  profile_visibility text not null default 'public',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

create table if not exists public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  skill_name text not null,
  proficiency_level text,
  years_experience int,
  created_at timestamptz not null default now(),
  unique (user_id, skill_name)
);

create table if not exists public.user_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  interest_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, interest_name)
);

create table if not exists public.user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  goal_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  reliability_weight int not null default 3,
  availability_weight int not null default 3,
  experience_weight int not null default 3,
  leadership_weight int not null default 3,
  communication_weight int not null default 3,
  technical_weight int not null default 3,
  local_preference text not null default 'either',
  preferred_team_size int,
  preferred_stage text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  slug text unique not null,
  description text,
  industry text,
  stage text not null default 'Idea',
  visibility text not null default 'Public',
  health_status text not null default 'Needs Attention',
  time_commitment text,
  looking_for_members boolean not null default true,
  launch_status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'Contributor',
  membership_status text not null default 'active',
  joined_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_skills_needed (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  skill_name text not null,
  priority int not null default 1,
  required_level text
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null default 'not_started',
  completion_percentage int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger milestones_updated_at before update on public.project_milestones
  for each row execute function public.set_updated_at();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  assigned_user_id uuid references public.users(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'todo',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references public.users(id) on delete set null,
  file_name text not null,
  file_url text not null,
  file_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  activity_type text not null,
  activity_description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_health (
  project_id uuid primary key references public.projects(id) on delete cascade,
  health_score int,
  health_status text,
  risk_factors jsonb,
  last_updated timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Matching
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid not null references public.users(id) on delete cascade,
  match_score int not null,
  stage_fit_score int,
  skill_fit_score int,
  compatibility_score int,
  status text not null default 'suggested',
  generated_at timestamptz not null default now(),
  unique (user_id, target_user_id)
);

create table if not exists public.project_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  match_score int not null,
  reasoning_summary text,
  generated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Messaging
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'direct',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid references public.users(id) on delete cascade,
  message_text text not null,
  read_status boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  message_text text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI
-- ---------------------------------------------------------------------------
create table if not exists public.ai_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  session_type text not null default 'personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ai_sessions_updated_at before update on public.ai_sessions
  for each row execute function public.set_updated_at();

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_roadmaps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  generated_by uuid references public.users(id) on delete set null,
  roadmap_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  accomplishments text,
  blockers text,
  next_steps text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reputation (V2 table, present for forward-compat)
-- ---------------------------------------------------------------------------
create table if not exists public.builder_reputation (
  user_id uuid primary key references public.users(id) on delete cascade,
  reliability_score int,
  execution_score int,
  collaboration_score int,
  expertise_score int,
  last_calculated_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Launches
-- ---------------------------------------------------------------------------
create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  launch_title text not null,
  launch_description text,
  launch_story text,
  website_url text,
  video_url text,
  launch_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.launch_screenshots (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  image_url text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_followers (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (launch_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Notifications & analytics
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  event_data jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- New auth user -> public.users row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpful indexes
create index if not exists idx_projects_owner on public.projects(owner_id);
create index if not exists idx_project_members_project on public.project_members(project_id);
create index if not exists idx_project_members_user on public.project_members(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_workspace_messages_project on public.workspace_messages(project_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
