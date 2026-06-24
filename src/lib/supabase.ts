import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Startup environment check. Returns a list of human-readable problems with the
 * Supabase configuration. An empty list means the env is internally consistent
 * (either fully configured for live mode, or fully absent for demo mode).
 */
export function validateSupabaseEnv(): string[] {
  const problems: string[] = [];
  const hasUrl = supabaseUrl.length > 0;
  const hasKey = supabaseAnonKey.length > 0;

  // Partial configuration is almost always a mistake (e.g. URL set but key
  // missing) and would silently fall back to demo mode.
  if (hasUrl !== hasKey) {
    problems.push(
      'Incomplete Supabase config: set BOTH EXPO_PUBLIC_SUPABASE_URL and ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY, or neither (demo mode).',
    );
  }
  if (hasUrl && !isValidUrl(supabaseUrl)) {
    problems.push(
      `EXPO_PUBLIC_SUPABASE_URL is not a valid URL: "${supabaseUrl}". ` +
        'Expected something like https://xxxx.supabase.co',
    );
  }
  return problems;
}

/**
 * True when Supabase credentials are configured. When false the app runs in a
 * local demo mode so screens remain explorable without a backend.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl),
);

/** Explicit runtime mode, surfaced in the UI so it's never ambiguous. */
export const supabaseMode: 'live' | 'demo' = isSupabaseConfigured ? 'live' : 'demo';

if (__DEV__) {
  const problems = validateSupabaseEnv();
  if (problems.length) {
    console.warn(`[Forge] Supabase config warning:\n - ${problems.join('\n - ')}`);
  }
  if (isSupabaseConfigured) {
    console.log(`[Forge] Live mode — connected to ${supabaseUrl}`);
  } else {
    console.warn(
      '[Forge] Demo mode — Supabase not configured. Data is stored on-device. ' +
        'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for live mode.',
    );
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'public-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // URL detection only matters on web OAuth redirects.
      detectSessionInUrl: Platform.OS === 'web',
    },
  },
);
