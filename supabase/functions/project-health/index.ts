// Forge project health calculator (V1).
//
// Computes a hidden internal score and exposes only a status label
// (Healthy / Needs Attention / At Risk). See docs/11_Cursor_Build_Instructions.md.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { project_id } = await req.json();
    if (!project_id) return json({ error: 'Missing project_id' }, 400);

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [activity, milestones, tasks, members] = await Promise.all([
      supabase.from('project_activity').select('id', { count: 'exact', head: true }).eq('project_id', project_id).gte('created_at', since),
      supabase.from('project_milestones').select('id', { count: 'exact', head: true }).eq('project_id', project_id),
      supabase.from('tasks').select('status, due_date').eq('project_id', project_id),
      supabase.from('project_members').select('id', { count: 'exact', head: true }).eq('project_id', project_id).eq('membership_status', 'active'),
    ]);

    const now = Date.now();
    const overdue = (tasks.data ?? []).filter(
      (t) => t.status !== 'done' && t.due_date && new Date(t.due_date).getTime() < now,
    ).length;

    let score = 100;
    if ((activity.count ?? 0) === 0) score -= 30;
    if ((milestones.count ?? 0) === 0) score -= 20;
    if (overdue > 3) score -= 20;
    if ((members.count ?? 0) < 2) score -= 15;

    const status = score >= 75 ? 'Healthy' : score >= 50 ? 'Needs Attention' : 'At Risk';

    await supabase.from('project_health').upsert({
      project_id,
      health_score: score,
      health_status: status,
      last_updated: new Date().toISOString(),
    });
    await supabase.from('projects').update({ health_status: status }).eq('id', project_id);

    return json({ status });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
