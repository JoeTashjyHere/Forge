import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabaseMode } from '@/lib/supabase';

interface ModeBannerProps {
  /** When true, render nothing in live mode (used on marketing surfaces). */
  demoOnly?: boolean;
}

/**
 * A small, intentional indicator of whether Forge is running against a live
 * backend or in on-device demo mode. Keeps the two modes from ever feeling
 * ambiguous to beta testers.
 */
export function ModeBanner({ demoOnly }: ModeBannerProps) {
  const theme = useTheme();
  const isDemo = supabaseMode === 'demo';

  if (!isDemo && demoOnly) return null;

  const color = isDemo ? '#F59E0B' : theme.success;
  const label = isDemo ? 'Demo mode' : 'Live';
  const detail = isDemo ? 'Your data stays on this device' : 'Connected to your Forge backend';

  return (
    <View style={[styles.container, { borderColor: color, backgroundColor: `${color}14` }]}>
      <Ionicons name={isDemo ? 'cloud-offline-outline' : 'cloud-done-outline'} size={16} color={color} />
      <Text variant="small" weight="semibold" style={{ color }}>
        {label}
      </Text>
      <Text variant="small" tone="muted" style={styles.detail}>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  detail: { flexShrink: 1 },
});
