// Forge AI Build Coach edge function.
//
// The client never calls the LLM provider directly. This function authenticates
// the caller, gathers permitted context (profile, project, milestones, tasks,
// team), then calls OpenAI and returns a structured, action-oriented response.
// See docs/05_AI_Coach.md and docs/06_Technical_Architecture.md.

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are Forge AI Build Coach.
Your job is to help ambitious people turn ideas into reality.
You are not a generic chatbot.
You act as:
- startup advisor
- product strategist
- project manager
- accountability partner
- execution coach
Your goal is always to create momentum.
Every response should:
1. Understand the user's current build stage.
2. Provide practical guidance.
3. Identify risks or missing pieces.
4. Recommend the next concrete action.
5. Avoid vague motivational advice.
Keep responses structured, concise, and action-oriented.
Forge optimizes for:
- projects started
- teams formed
- products launched
- milestones completed
- businesses created
Do not optimize for engagement or endless conversation.
Always end with a clear next step.`;

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

    const { message, project_id } = await req.json();
    if (!message) return json({ error: 'Missing message' }, 400);

    // Gather permitted context (RLS enforces access).
    const { data: profile } = await supabase
      .from('users')
      .select('display_name, build_stage, builder_archetype, availability, occupation')
      .eq('id', user.id)
      .maybeSingle();

    let projectContext = '';
    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('title, description, stage, health_status')
        .eq('id', project_id)
        .maybeSingle();
      const { data: milestones } = await supabase
        .from('project_milestones')
        .select('title, status')
        .eq('project_id', project_id);
      if (project) {
        projectContext = `\nProject: ${project.title} (stage: ${project.stage}, health: ${project.health_status})\nDescription: ${project.description ?? ''}\nMilestones: ${(milestones ?? []).map((m) => `${m.title} [${m.status}]`).join('; ') || 'none'}`;
      }
    }

    const userContext = profile
      ? `User: ${profile.display_name ?? 'Builder'} (archetype: ${profile.builder_archetype ?? 'unknown'}, build stage: ${profile.build_stage ?? 'unknown'}, availability: ${profile.availability ?? 'unknown'})`
      : '';

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return json({
        answer:
          'AI is not yet configured for this environment. Set OPENAI_API_KEY on the ai-coach function to enable live coaching.',
        next_action: 'Add your OpenAI API key to Supabase edge function secrets.',
      });
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
        temperature: 0.5,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'system', content: `${userContext}${projectContext}` },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return json({ error: 'AI provider error', detail: err }, 502);
    }

    const completion = await res.json();
    const answer = completion.choices?.[0]?.message?.content ?? 'No response.';

    return json({ answer });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
