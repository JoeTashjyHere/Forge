import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AIContextType } from '@/types/ai';

export interface CoachRequest {
  userId: string;
  projectId?: string | null;
  message: string;
  contextType?: AIContextType;
}

export interface CoachResult {
  answer: string;
  nextAction?: string;
}

/**
 * Sends a message to the Forge AI Build Coach. The client never calls the LLM
 * provider directly — it invokes the `ai-coach` Supabase Edge Function (see
 * docs/06_Technical_Architecture.md). In demo mode a structured, on-brand
 * canned response is returned so the experience is explorable offline.
 */
export async function sendCoachMessage(req: CoachRequest): Promise<CoachResult> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.functions.invoke('ai-coach', {
      body: {
        user_id: req.userId,
        project_id: req.projectId ?? null,
        message: req.message,
        context_type: req.contextType ?? 'general',
      },
    });
    if (error) throw error;
    return {
      answer: data?.answer ?? data?.content ?? 'No response.',
      nextAction: data?.next_action ?? data?.nextAction,
    };
  }

  await new Promise((r) => setTimeout(r, 600));
  return demoCoachResponse(req.message);
}

function demoCoachResponse(message: string): CoachResult {
  const m = message.toLowerCase();
  if (m.includes('idea') || m.includes('validate')) {
    return {
      answer:
        'Strong starting point. Before building, validate demand: write a one-sentence problem statement, list 3 people who have this problem, and reach out to all 3 this week. Capture exact quotes about how they solve it today.',
      nextAction: 'Talk to 3 potential users and summarize what you learn.',
    };
  }
  if (m.includes('team') || m.includes('cofounder') || m.includes('hire')) {
    return {
      answer:
        'At your stage, prioritize a complementary builder over similar profiles. If you are a visionary, your highest-leverage teammate is someone who can ship the first version. Define the single most important role and recruit specifically for it.',
      nextAction: 'Open Matches and reach out to your top recommended builder.',
    };
  }
  if (m.includes('launch') || m.includes('ship')) {
    return {
      answer:
        'Scope a launch you can ship in 2 weeks. Cut everything that is not core to the one job your product does. Draft a simple landing page, a 60-second demo, and a list of 10 people to tell on day one.',
      nextAction: 'Write your launch checklist and pick a target date.',
    };
  }
  return {
    answer:
      "Here's how I'd think about it: clarify the single outcome you want this week, identify the one blocker in the way, and take the smallest concrete action that creates momentum. Progress over perfection.",
    nextAction: 'Define one concrete action you can finish in the next 48 hours.',
  };
}
