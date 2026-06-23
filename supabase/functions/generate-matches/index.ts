// Forge match generation edge function (V1 scaffold).
//
// In V1, weighted scoring also runs client-side in src/lib/matching.ts. This
// function exists to precompute and persist recommendations server-side and is
// the seam where the V2 ML matching engine will live. See docs/04_Matching_Engine.md.

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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    // Placeholder: return a small set of candidate builders. The full weighted
    // scoring lives in src/lib/matching.ts for V1.
    const { data: candidates } = await supabase
      .from('users')
      .select('id, display_name, occupation, builder_archetype, build_stage')
      .neq('id', user.id)
      .eq('onboarding_completed', true)
      .limit(20);

    return json({ candidates: candidates ?? [] });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
