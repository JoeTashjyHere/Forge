import { Colors, type ColorScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useScheme(): ColorScheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

/** Returns the active semantic color palette for the current color scheme. */
export function useTheme() {
  const scheme = useScheme();
  return Colors[scheme];
}

export type Theme = ReturnType<typeof useTheme>;
