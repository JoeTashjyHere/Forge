import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Text } from '@/components/ui/Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, style, multiline, ...rest },
  ref,
) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="label" tone="secondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
          multiline && styles.multiline,
          style,
        ]}
        multiline={multiline}
        {...rest}
      />
      {error ? (
        <Text variant="small" tone="danger" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="muted" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  label: { marginLeft: 2 },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: FontSize.body,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: Spacing.three,
  },
  helper: { marginLeft: 2 },
});
