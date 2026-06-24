#!/usr/bin/env node
/**
 * Forge live backend smoke test.
 *
 * Creates two real test users against a configured Supabase project and walks
 * the core happy path end to end, exercising Row Level Security as each user.
 * Everything it creates is cleaned up at the end.
 *
 * Usage:
 *   SUPABASE_URL=...                  (https://xxxx.supabase.co)
 *   SUPABASE_ANON_KEY=...             (anon public key — RLS-scoped clients)
 *   SUPABASE_SERVICE_ROLE_KEY=...     (service_role — creates/deletes users only)
 *   node scripts/smoke-test.mjs
 *
 * Exit code 0 = all steps passed, 1 = a step failed or env is missing.
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error(
    'Missing env. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'The service_role key is only used to create/delete the two test users.',
  );
  process.exit(1);
}

const stamp = Date.now();
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
async function step(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`  FAIL  ${name}\n        ${e?.message ?? e}`);
    throw e; // later steps depend on earlier ones; stop the chain
  }
}

function userClient() {
  return createClient(URL, ANON, { auth: { persistSession: false } });
}
async function signIn(email, password) {
  const c = userClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign in failed: ${error.message}`);
  return c;
}
function must(error, label) {
  if (error) throw new Error(`${label}: ${error.message}`);
}

const state = {};

async function run() {
  const emailA = `forge_smoke_a_${stamp}@example.com`;
  const emailB = `forge_smoke_b_${stamp}@example.com`;
  const password = `Forge!${stamp}`;

  console.log(`\nForge smoke test against ${URL}\n`);

  await step('signup: create two confirmed users', async () => {
    const a = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    must(a.error, 'create user A');
    const b = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    must(b.error, 'create user B');
    state.aId = a.data.user.id;
    state.bId = b.data.user.id;
  });

  await step('auth profile trigger: public.users rows exist', async () => {
    // handle_new_user() should have created a row per auth user.
    const { data, error } = await admin
      .from('users')
      .select('id')
      .in('id', [state.aId, state.bId]);
    must(error, 'select users');
    if ((data ?? []).length !== 2) throw new Error('expected 2 profile rows from trigger');
  });

  await step('sign in both users', async () => {
    state.A = await signIn(emailA, password);
    state.B = await signIn(emailB, password);
  });

  await step('onboarding: update profile + skills (self only)', async () => {
    must(
      (
        await state.A.from('users')
          .update({
            first_name: 'Smoke',
            last_name: 'Alpha',
            display_name: 'Smoke Alpha',
            build_stage: 'Building',
            builder_archetype: 'Builder',
            availability: '10-20',
            onboarding_completed: true,
          })
          .eq('id', state.aId)
      ).error,
      'update profile A',
    );
    must(
      (await state.A.from('user_skills').insert({ user_id: state.aId, skill_name: 'AI' })).error,
      'insert skill A',
    );
    // B onboards too (needed to appear in matches).
    must(
      (
        await state.B.from('users')
          .update({ display_name: 'Smoke Bravo', onboarding_completed: true })
          .eq('id', state.bId)
      ).error,
      'update profile B',
    );
  });

  await step('security: user A cannot edit user B profile', async () => {
    const { error } = await state.A.from('users')
      .update({ display_name: 'hacked' })
      .eq('id', state.bId);
    // RLS makes the row invisible to the update; treat a thrown error OR a
    // no-op (B unchanged) as success.
    const { data } = await admin.from('users').select('display_name').eq('id', state.bId).single();
    if (data?.display_name === 'hacked') throw new Error('A was able to edit B (RLS hole!)');
    void error;
  });

  await step('project creation (owner)', async () => {
    const ins = await state.A.from('projects')
      .insert({
        owner_id: state.aId,
        title: 'Smoke Project',
        slug: `smoke-${stamp}`,
        description: 'Smoke test project',
        stage: 'MVP',
        visibility: 'Public',
      })
      .select('*')
      .single();
    must(ins.error, 'insert project');
    state.projectId = ins.data.id;
    must(
      (
        await state.A.from('project_members').insert({
          project_id: state.projectId,
          user_id: state.aId,
          role: 'Owner',
          membership_status: 'active',
        })
      ).error,
      'insert owner membership',
    );
  });

  await step('join request (user B -> A public project)', async () => {
    const ins = await state.B.from('project_members')
      .insert({
        project_id: state.projectId,
        user_id: state.bId,
        role: 'Contributor',
        membership_status: 'pending',
      })
      .select('id')
      .single();
    must(ins.error, 'insert join request');
    state.bMembershipId = ins.data.id;
  });

  await step('invite accept (owner approves B)', async () => {
    must(
      (
        await state.A.from('project_members')
          .update({ membership_status: 'active' })
          .eq('id', state.bMembershipId)
      ).error,
      'approve membership',
    );
  });

  await step('direct messaging (A <-> B)', async () => {
    const conv = await state.A.from('conversations')
      .insert({ conversation_type: 'direct' })
      .select('id')
      .single();
    must(conv.error, 'create conversation');
    state.convId = conv.data.id;
    must(
      (
        await state.A.from('conversation_members').insert([
          { conversation_id: state.convId, user_id: state.aId },
        ])
      ).error,
      'add self to conversation',
    );
    must(
      (
        await state.A.from('conversation_members').insert([
          { conversation_id: state.convId, user_id: state.bId },
        ])
      ).error,
      'add B to conversation',
    );
    must(
      (
        await state.A.from('messages').insert({
          conversation_id: state.convId,
          sender_id: state.aId,
          recipient_id: state.bId,
          message_text: 'Hello from smoke test',
        })
      ).error,
      'send direct message',
    );
    const read = await state.B.from('messages').select('id').eq('conversation_id', state.convId);
    must(read.error, 'B read messages');
    if ((read.data ?? []).length < 1) throw new Error('B could not read the message');
  });

  await step('workspace chat (project member)', async () => {
    must(
      (
        await state.B.from('workspace_messages').insert({
          project_id: state.projectId,
          sender_id: state.bId,
          message_text: 'Workspace hello',
        })
      ).error,
      'B post workspace message',
    );
  });

  await step('roadmap persistence (ai_roadmaps)', async () => {
    must(
      (
        await state.A.from('ai_roadmaps').insert({
          project_id: state.projectId,
          generated_by: state.aId,
          roadmap_json: { summary: 'smoke', weeks: [] },
        })
      ).error,
      'insert roadmap',
    );
  });

  await step('milestones + tasks', async () => {
    must(
      (
        await state.A.from('project_milestones').insert({
          project_id: state.projectId,
          title: 'Smoke milestone',
          status: 'completed',
          completion_percentage: 100,
        })
      ).error,
      'insert milestone',
    );
    must(
      (
        await state.A.from('tasks').insert({
          project_id: state.projectId,
          title: 'Smoke task',
          status: 'done',
          priority: 'high',
        })
      ).error,
      'insert task',
    );
  });

  await step('launch publishing', async () => {
    const ins = await state.A.from('launches')
      .insert({
        project_id: state.projectId,
        launch_title: 'Smoke Launch',
        launch_description: 'Shipped via smoke test',
        status: 'published',
        launch_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    must(ins.error, 'publish launch');
    state.launchId = ins.data.id;
  });

  await step('marketplace follow (B follows published launch)', async () => {
    must(
      (
        await state.B.from('launch_followers').insert({
          launch_id: state.launchId,
          user_id: state.bId,
        })
      ).error,
      'follow launch',
    );
  });
}

async function cleanup() {
  console.log('\nCleaning up…');
  try {
    if (state.projectId) await admin.from('projects').delete().eq('id', state.projectId);
    if (state.convId) await admin.from('conversations').delete().eq('id', state.convId);
    if (state.aId) await admin.auth.admin.deleteUser(state.aId);
    if (state.bId) await admin.auth.admin.deleteUser(state.bId);
    console.log('  done.');
  } catch (e) {
    console.log(`  cleanup warning: ${e?.message ?? e}`);
  }
}

try {
  await run();
} catch {
  // step() already logged the failure; fall through to cleanup + summary.
} finally {
  await cleanup();
  console.log(`\nResult: ${passed} passed, ${failed} failed.\n`);
  process.exit(failed > 0 ? 1 : 0);
}
