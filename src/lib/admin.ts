import { isSupabaseConfigured } from '@/lib/supabase';

/**
 * Comma-separated allowlist of admin emails, e.g.
 * EXPO_PUBLIC_ADMIN_EMAILS="you@forge.build,teammate@forge.build"
 *
 * This gates the admin UI only. The real authorization boundary is the
 * `is_admin()` SQL function + `admin_users` table enforced by RLS (see
 * supabase/migrations/0003_beta.sql). Add an admin in both places.
 */
const ADMIN_EMAILS = ((process.env.EXPO_PUBLIC_ADMIN_EMAILS as string | undefined) ?? '')
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(profile: { email?: string | null } | null | undefined): boolean {
  // In demo mode there is no backend; treat the local user as an admin so the
  // admin placeholder is explorable on-device.
  if (!isSupabaseConfigured) return true;
  const email = profile?.email?.toLowerCase();
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}
