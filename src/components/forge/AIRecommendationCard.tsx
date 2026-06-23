import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface AIRecommendationCardProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * The single most important next action, surfaced at the top of Home.
 * See docs/03_User_Experience.md and docs/05_AI_Coach.md.
 */
export function AIRecommendationCard({
  title,
  body,
  actionLabel,
  onAction,
}: AIRecommendationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
        </View>
        <Text variant="small" style={styles.kicker}>
          AI RECOMMENDED NEXT STEP
        </Text>
      </View>
      <Text variant="h4" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} variant="secondary" onPress={onAction} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.deepNavy,
    borderRadius: Radius.card,
    padding: Spacing.five,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Brand.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: '#94A3B8', letterSpacing: 1 },
  title: { color: '#FFFFFF', marginTop: Spacing.three },
  body: { color: '#CBD5E1', marginTop: Spacing.two },
  action: { marginTop: Spacing.four, alignSelf: 'flex-start' },
});
