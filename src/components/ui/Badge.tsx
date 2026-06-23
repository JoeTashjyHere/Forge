import { StyleSheet, View, type ViewStyle } from 'react-native';
import { FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Text } from '@/components/ui/Text';

interface BadgeProps {
  label: string;
  /** Explicit dot/text color. Falls back to the theme tint. */
  color?: string;
  /** Render a small leading status dot. */
  dot?: boolean;
  variant?: 'soft' | 'outline' | 'solid';
  style?: ViewStyle;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function Badge({ label, color, dot, variant = 'soft', style }: BadgeProps) {
  const theme = useTheme();
  const accent = color ?? theme.tint;

  const containerStyle: ViewStyle =
    variant === 'solid'
      ? { backgroundColor: accent }
      : variant === 'outline'
        ? { borderWidth: 1, borderColor: accent }
        : { backgroundColor: hexToRgba(accent, 0.12) };

  const textColor = variant === 'solid' ? '#FFFFFF' : accent;

  return (
    <View style={[styles.badge, containerStyle, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: textColor }]} /> : null}
      <Text style={{ color: textColor, fontSize: 12, fontWeight: FontWeight.semibold }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
