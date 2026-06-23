// Forge roadmap generator edge function.
//
// Generates a structured 30-day roadmap (JSON) for a project and stores it in
// ai_roadmaps. See docs/05_AI_Coach.md and the AI Roadmap Output Format in
// docs/11_Cursor_Build_Instructions.md.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const ROADMAP_INSTRUCTION = `You are the Forge AI Build Coach. Produce a practical 30-day roadmap.
Return ONLY valid JSON matching exactly this shape:
{
  "summary": "",
  "stage": "",
  "recommended_team": [{ "role": "", "reason": "" }],
  "risks": [{ "risk": "", "severity": "low|medium|high", "mitigation": "" }],
  "weeks": [{ "week": 1, "goal": "", "milestones": [], "tasks": [] }],
  "next_action": ""
}
Include weeks 1 through 4. Be concrete and action-oriented.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { project_id, title, description, stage, skills, goals } = await req.json();

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'OPENAI_API_KEY not configured' }, 503);

    const prompt = `Project: ${title}\nDescription: ${description ?? ''}\nStage: ${stage ?? 'Idea'}\nSkills available: ${(skills ?? []).join(', ')}\nGoals: ${(goals ?? []).join(', ')}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ROADMAP_INSTRUCTION },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) return json({ error: 'AI provider error', detail: await res.text() }, 502);

    const completion = await res.json();
    const roadmap = JSON.parse(completion.choices?.[0]?.message?.content ?? '{}');

    if (project_id) {
      await supabase.from('ai_roadmaps').insert({
        project_id,
        generated_by: user.id,
        roadmap_json: roadmap,
      });
    }

    return json({ roadmap });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
