import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Text } from '@/components/ui/Text';

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  color?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Allow wrapping to multiple rows when there are many options. */
  wrap?: boolean;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  wrap,
}: SegmentedProps<T>) {
  const theme = useTheme();
  return (
    <View style={[styles.container, wrap && styles.wrap]}>
      {options.map((opt) => {
        const active = opt.key === value;
        const accent = opt.color ?? theme.tint;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              styles.item,
              wrap ? styles.itemWrap : styles.itemFlex,
              {
                backgroundColor: active ? accent : theme.backgroundElement,
                borderColor: active ? accent : theme.border,
              },
            ]}
          >
            <Text
              variant="small"
              numberOfLines={1}
              style={{ color: active ? '#FFFFFF' : theme.textSecondary }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: Spacing.one },
  wrap: { flexWrap: 'wrap' },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
    borderWidth: 1,
  },
  itemFlex: { flex: 1 },
  itemWrap: { flexGrow: 1 },
});
