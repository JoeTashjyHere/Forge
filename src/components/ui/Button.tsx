import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
} from 'react-native';
import { FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Text } from '@/components/ui/Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

const SIZE_STYLE: Record<Size, { paddingVertical: number; fontSize: number }> = {
  sm: { paddingVertical: Spacing.two, fontSize: FontSize.caption },
  md: { paddingVertical: Spacing.three, fontSize: FontSize.label },
  lg: { paddingVertical: Spacing.four, fontSize: FontSize.body },
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth = true,
  leftIcon,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { bg: theme.tint, border: theme.tint, text: theme.textInverse },
    secondary: { bg: 'transparent', border: theme.tint, text: theme.tint },
    ghost: { bg: 'transparent', border: 'transparent', text: theme.text },
    destructive: { bg: theme.danger, border: theme.danger, text: '#FFFFFF' },
  }[variant];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingVertical: SIZE_STYLE[size].paddingVertical,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.fullWidth,
        style as any,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text
            style={{
              color: palette.text,
              fontSize: SIZE_STYLE[size].fontSize,
              fontWeight: FontWeight.semibold,
            }}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
