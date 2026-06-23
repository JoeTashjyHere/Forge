import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatRelativeTime } from '@/lib/dates';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';
import type { ConversationSummary } from '@/types/messaging';

export default function MessagesTab() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const profileId = profile?.id;
  const conversations = useMessagingStore((s) => s.conversations);
  const loaded = useMessagingStore((s) => s.conversationsLoaded);
  const loadConversations = useMessagingStore((s) => s.loadConversations);

  useFocusEffect(
    useCallback(() => {
      if (profileId) void loadConversations(profileId);
    }, [profileId, loadConversations]),
  );

  return (
    <Screen>
      <Text variant="h2" style={{ marginBottom: Spacing.five }}>
        Messages
      </Text>

      {!loaded ? (
        <LoadingState />
      ) : conversations.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            description="Connect with a recommended builder to start a conversation and form a team."
            actionLabel="Find builders"
            onAction={() => router.push('/(tabs)/matches')}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {conversations.map((c) => (
            <ConversationRow
              key={c.id}
              conversation={c}
              onPress={() => router.push(`/messages/${c.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationSummary;
  onPress: () => void;
}) {
  const theme = useTheme();
  const unread = conversation.unreadCount > 0;
  return (
    <Card onPress={onPress} padded={false}>
      <View style={styles.row}>
        <Avatar name={conversation.otherName} uri={conversation.otherPhotoUrl} size={48} />
        <View style={styles.body}>
          <View style={styles.topLine}>
            <Text variant="label" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
              {conversation.otherName}
            </Text>
            <Text variant="small" tone="muted">
              {formatRelativeTime(conversation.lastMessageAt)}
            </Text>
          </View>
          <Text
            variant="caption"
            tone={unread ? 'default' : 'secondary'}
            weight={unread ? 'semibold' : undefined}
            numberOfLines={1}
          >
            {conversation.lastMessage ?? 'Say hello and get the conversation going.'}
          </Text>
        </View>
        {unread ? (
          <View style={[styles.badge, { backgroundColor: theme.tint }]}>
            <Text variant="small" weight="bold" style={{ color: theme.textInverse }}>
              {conversation.unreadCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  list: { gap: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  body: { flex: 1, gap: 2 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: Radius.pill,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
