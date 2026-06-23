-- Forge Row Level Security policies (V1).
-- Every table has RLS enabled. Users may only access their own data and data
-- in projects/conversations they belong to. See docs/06_Technical_Architecture.md.

-- ---------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_project_member(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid() and m.membership_status = 'active'
  ) or exists (
    select 1 from public.projects p where p.id = pid and p.owner_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p where p.id = pid and p.owner_id = auth.uid()
  ) or exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid()
      and m.role in ('Owner', 'Admin') and m.membership_status = 'active'
  );
$$;

create or replace function public.is_conversation_member(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = cid and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_public(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects p where p.id = pid and p.visibility = 'Public');
$$;

-- Enable RLS everywhere
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Lookup tables: read-only to all authenticated users
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'builder_archetypes','build_stages','project_stages','availability_levels','skills','interests'
  ] loop
    execute format('drop policy if exists "%s_read" on public.%I;', t, t);
    execute format('create policy "%s_read" on public.%I for select to authenticated using (true);', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (profile_visibility <> 'private' or id = auth.uid());

drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert to authenticated
  with check (id = auth.uid());

drop policy if exists users_update on public.users;
create policy users_update on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- user_skills / user_interests / user_goals: readable by authenticated, writable by owner
do $$
declare t text;
begin
  foreach t in array array['user_skills','user_interests','user_goals'] loop
    execute format('drop policy if exists "%s_read" on public.%I;', t, t);
    execute format('create policy "%s_read" on public.%I for select to authenticated using (true);', t, t);
    execute format('drop policy if exists "%s_write" on public.%I;', t, t);
    execute format('create policy "%s_write" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
  end loop;
end $$;

drop policy if exists partner_prefs_all on public.partner_preferences;
create policy partner_prefs_all on public.partner_preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated
  using (visibility = 'Public' or owner_id = auth.uid() or public.is_project_member(id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
  using (public.is_project_admin(id)) with check (public.is_project_admin(id));

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated
  using (owner_id = auth.uid());

-- project_members
drop policy if exists members_select on public.project_members;
create policy members_select on public.project_members for select to authenticated
  using (public.is_project_member(project_id) or public.is_project_public(project_id));

drop policy if exists members_join on public.project_members;
create policy members_join on public.project_members for insert to authenticated
  with check (user_id = auth.uid() or public.is_project_admin(project_id));

drop policy if exists members_update on public.project_members;
create policy members_update on public.project_members for update to authenticated
  using (public.is_project_admin(project_id) or user_id = auth.uid());

drop policy if exists members_delete on public.project_members;
create policy members_delete on public.project_members for delete to authenticated
  using (public.is_project_admin(project_id) or user_id = auth.uid());

-- project child tables: members read; admins/members write
do $$
declare t text;
begin
  foreach t in array array[
    'project_skills_needed','project_milestones','tasks','project_files','project_activity'
  ] loop
    execute format('drop policy if exists "%s_select" on public.%I;', t, t);
    execute format('create policy "%s_select" on public.%I for select to authenticated using (public.is_project_member(project_id) or public.is_project_public(project_id));', t, t);
    execute format('drop policy if exists "%s_write" on public.%I;', t, t);
    execute format('create policy "%s_write" on public.%I for all to authenticated using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));', t, t);
  end loop;
end $$;

drop policy if exists project_health_select on public.project_health;
create policy project_health_select on public.project_health for select to authenticated
  using (public.is_project_member(project_id) or public.is_project_public(project_id));
drop policy if exists project_health_write on public.project_health;
create policy project_health_write on public.project_health for all to authenticated
  using (public.is_project_admin(project_id)) with check (public.is_project_admin(project_id));

-- workspace messages: project members only
drop policy if exists workspace_msgs_select on public.workspace_messages;
create policy workspace_msgs_select on public.workspace_messages for select to authenticated
  using (public.is_project_member(project_id));
drop policy if exists workspace_msgs_insert on public.workspace_messages;
create policy workspace_msgs_insert on public.workspace_messages for insert to authenticated
  with check (public.is_project_member(project_id) and sender_id = auth.uid());

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
drop policy if exists matches_select on public.matches;
create policy matches_select on public.matches for select to authenticated
  using (user_id = auth.uid());

drop policy if exists project_matches_select on public.project_matches;
create policy project_matches_select on public.project_matches for select to authenticated
  using (user_id = auth.uid() or public.is_project_admin(project_id));

-- ---------------------------------------------------------------------------
-- messaging
-- ---------------------------------------------------------------------------
drop policy if exists conversations_select on public.conversations;
create policy conversations_select on public.conversations for select to authenticated
  using (public.is_conversation_member(id));
drop policy if exists conversations_insert on public.conversations;
create policy conversations_insert on public.conversations for insert to authenticated
  with check (true);

drop policy if exists conv_members_select on public.conversation_members;
create policy conv_members_select on public.conversation_members for select to authenticated
  using (public.is_conversation_member(conversation_id));
drop policy if exists conv_members_insert on public.conversation_members;
create policy conv_members_insert on public.conversation_members for insert to authenticated
  with check (user_id = auth.uid() or public.is_conversation_member(conversation_id));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (
    sender_id = auth.uid() or recipient_id = auth.uid()
    or (conversation_id is not null and public.is_conversation_member(conversation_id))
  );
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = auth.uid());
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AI: owner only
-- ---------------------------------------------------------------------------
drop policy if exists ai_sessions_all on public.ai_sessions;
create policy ai_sessions_all on public.ai_sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists ai_messages_all on public.ai_messages;
create policy ai_messages_all on public.ai_messages for all to authenticated
  using (exists (select 1 from public.ai_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.ai_sessions s where s.id = session_id and s.user_id = auth.uid()));

drop policy if exists ai_roadmaps_select on public.ai_roadmaps;
create policy ai_roadmaps_select on public.ai_roadmaps for select to authenticated
  using (public.is_project_member(project_id));
drop policy if exists ai_roadmaps_write on public.ai_roadmaps;
create policy ai_roadmaps_write on public.ai_roadmaps for all to authenticated
  using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));

drop policy if exists checkins_all on public.weekly_checkins;
create policy checkins_all on public.weekly_checkins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reputation_select on public.builder_reputation;
create policy reputation_select on public.builder_reputation for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- launches: public read; project admins manage
-- ---------------------------------------------------------------------------
drop policy if exists launches_select on public.launches;
create policy launches_select on public.launches for select to authenticated
  using (status = 'published' or public.is_project_member(project_id));
drop policy if exists launches_write on public.launches;
create policy launches_write on public.launches for all to authenticated
  using (public.is_project_admin(project_id)) with check (public.is_project_admin(project_id));

drop policy if exists launch_screens_select on public.launch_screenshots;
create policy launch_screens_select on public.launch_screenshots for select to authenticated using (true);
drop policy if exists launch_screens_write on public.launch_screenshots;
create policy launch_screens_write on public.launch_screenshots for all to authenticated
  using (exists (select 1 from public.launches l where l.id = launch_id and public.is_project_admin(l.project_id)))
  with check (exists (select 1 from public.launches l where l.id = launch_id and public.is_project_admin(l.project_id)));

drop policy if exists launch_followers_all on public.launch_followers;
create policy launch_followers_all on public.launch_followers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists launch_followers_read on public.launch_followers;
create policy launch_followers_read on public.launch_followers for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- notifications & analytics: owner only
-- ---------------------------------------------------------------------------
drop policy if exists notifications_all on public.notifications;
create policy notifications_all on public.notifications for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);
drop policy if exists analytics_select on public.analytics_events;
create policy analytics_select on public.analytics_events for select to authenticated
  using (user_id = auth.uid());
