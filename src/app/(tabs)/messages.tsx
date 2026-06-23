import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';

export default function MessagesTab() {
  return (
    <Screen>
      <Text variant="h2" style={{ marginBottom: Spacing.five }}>
        Messages
      </Text>
      <View style={styles.center}>
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="Connect with a recommended builder to start a conversation and form a team."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
