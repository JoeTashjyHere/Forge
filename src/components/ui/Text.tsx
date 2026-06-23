import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { FontSize, FontWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'label' | 'caption' | 'small';
type Tone = 'default' | 'secondary' | 'muted' | 'inverse' | 'tint' | 'danger' | 'success';

const VARIANTS: Record<Variant, { fontSize: number; fontWeight: any; lineHeight: number }> = {
  h1: { fontSize: FontSize.h1, fontWeight: FontWeight.bold, lineHeight: 46 },
  h2: { fontSize: FontSize.h2, fontWeight: FontWeight.bold, lineHeight: 38 },
  h3: { fontSize: FontSize.h3, fontWeight: FontWeight.semibold, lineHeight: 30 },
  h4: { fontSize: FontSize.h4, fontWeight: FontWeight.semibold, lineHeight: 26 },
  body: { fontSize: FontSize.body, fontWeight: FontWeight.regular, lineHeight: 24 },
  label: { fontSize: FontSize.label, fontWeight: FontWeight.medium, lineHeight: 20 },
  caption: { fontSize: FontSize.caption, fontWeight: FontWeight.regular, lineHeight: 20 },
  small: { fontSize: FontSize.small, fontWeight: FontWeight.medium, lineHeight: 16 },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: keyof typeof FontWeight;
  center?: boolean;
}

export function Text({
  variant = 'body',
  tone = 'default',
  weight,
  center,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const toneColor = {
    default: theme.text,
    secondary: theme.textSecondary,
    muted: theme.textMuted,
    inverse: theme.textInverse,
    tint: theme.tint,
    danger: theme.danger,
    success: theme.success,
  }[tone];

  const v = VARIANTS[variant];

  return (
    <RNText
      style={[
        {
          fontSize: v.fontSize,
          fontWeight: weight ? FontWeight[weight] : v.fontWeight,
          lineHeight: v.lineHeight,
          color: toneColor,
        },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
  );
}
