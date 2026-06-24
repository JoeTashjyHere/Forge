-- Fix: direct conversation creation under RLS.
--
-- Symptom: creating a conversation failed with
--   "new row violates row-level security policy for table conversations".
--
-- Cause: the flow inserted a conversation and read it back with RETURNING
-- (supabase-js `.insert().select()`). The conversations SELECT policy is
-- member-only (`is_conversation_member(id)`), but at INSERT time no membership
-- row exists yet, so the RETURNING row is not visible and Postgres rejects it.
-- The conversation + both memberships must be created atomically.
--
-- Fix: a SECURITY DEFINER function creates the conversation and both
-- memberships in one transaction and returns the id. It only ever adds the
-- caller (auth.uid()) and the requested recipient, so it cannot be used to join
-- arbitrary conversations. No table policy is loosened; conversations remain
-- readable only to their members.

create or replace function public.create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing uuid;
  new_id uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if other_user_id is null or other_user_id = me then
    raise exception 'invalid recipient';
  end if;

  -- Reuse an existing 1:1 conversation between the two users, if any.
  select cm.conversation_id into existing
  from public.conversation_members cm
  join public.conversation_members other_cm
    on other_cm.conversation_id = cm.conversation_id
   and other_cm.user_id = other_user_id
  join public.conversations c
    on c.id = cm.conversation_id and c.conversation_type = 'direct'
  where cm.user_id = me
  limit 1;

  if existing is not null then
    return existing;
  end if;

  insert into public.conversations (conversation_type)
  values ('direct')
  returning id into new_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (new_id, me), (new_id, other_user_id);

  return new_id;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;

-- Strengthen message inserts: a sender must also be a member of the
-- conversation (requirement: users may only post into conversations they
-- belong to). This is a tightening, not a loosening — the create function above
-- guarantees both participants are members before any message is sent.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (conversation_id is null or public.is_conversation_member(conversation_id))
  );
