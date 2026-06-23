import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Forge tracks outcomes, not engagement. These events feed the success metrics
 * defined in docs/01_Vision.md (projects started, teams formed, launches, etc.).
 */
export type AnalyticsEvent =
  | 'signup'
  | 'onboarding_complete'
  | 'project_created'
  | 'project_joined'
  | 'match_viewed'
  | 'message_sent'
  | 'roadmap_generated'
  | 'milestone_completed'
  | 'launch_published';

export async function trackEvent(
  event: AnalyticsEvent,
  userId: string | null,
  data?: Record<string, unknown>,
) {
  if (__DEV__) {
    console.log(`[analytics] ${event}`, data ?? {});
  }
  if (!isSupabaseConfigured) return;
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: event,
      event_data: data ?? {},
    });
  } catch {
    // Analytics must never break the user experience.
  }
}
