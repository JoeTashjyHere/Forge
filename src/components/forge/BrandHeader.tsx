import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { Text } from '@/components/ui/Text';

interface BrandHeaderProps {
  title?: string;
  subtitle?: string;
}

export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.mark}>
          <Ionicons name="hammer" size={20} color="#FFFFFF" />
        </View>
        <Text variant="h3" weight="bold">
          Forge
        </Text>
      </View>
      {title ? (
        <Text variant="h2" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text tone="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  mark: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    backgroundColor: Brand.deepNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: Spacing.four },
  subtitle: { marginTop: -Spacing.one },
});
