import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Text } from '@/components/ui/Text';

interface OptionCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  onPress?: () => void;
  accentColor?: string;
}

export function OptionCard({
  title,
  description,
  selected,
  onPress,
  accentColor,
}: OptionCardProps) {
  const theme = useTheme();
  const accent = accentColor ?? theme.tint;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElevated,
          borderColor: selected ? accent : theme.border,
        },
      ]}
    >
      <View style={styles.text}>
        <Text variant="label" weight="semibold">
          {title}
        </Text>
        {description ? (
          <Text variant="caption" tone="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? accent : theme.borderStrong}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    padding: Spacing.four,
  },
  text: { flex: 1, gap: 2 },
});
