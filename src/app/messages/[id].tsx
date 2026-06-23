import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { ChatComposer } from '@/components/forge/ChatComposer';
import { Text } from '@/components/ui/Text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClockTime } from '@/lib/dates';
import { useAuthStore } from '@/store/authStore';
import { useMessagingStore } from '@/store/messagingStore';

export default function ConversationDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const scrollRef = useRef<ScrollView>(null);

  const messages = useMessagingStore((s) => s.messagesByConversation[id!] ?? []);
  const summary = useMessagingStore((s) => s.conversations.find((c) => c.id === id));
  const loadMessages = useMessagingStore((s) => s.loadMessages);
  const sendDirectMessage = useMessagingStore((s) => s.sendDirectMessage);
  const markConversationRead = useMessagingStore((s) => s.markConversationRead);
  const subscribeConversation = useMessagingStore((s) => s.subscribeConversation);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = summary?.otherName ?? name ?? 'Conversation';
  const meId = profile?.id;

  useEffect(() => {
    if (!id || !meId) return;
    void loadMessages(id, meId);
    const unsub = subscribeConversation(id);
    return unsub;
  }, [id, meId, loadMessages, subscribeConversation]);

  // Mark read whenever new messages arrive while this screen is open.
  useEffect(() => {
    if (id && meId && messages.length) void markConversationRead(id, meId);
  }, [id, meId, messages.length, markConversationRead]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !id || !meId) return;
    setInput('');
    setSending(true);
    setError(null);
    try {
      await sendDirectMessage(id, meId, summary?.otherUserId ?? null, text);
    } catch {
      setInput(text);
      setError('Message failed to send. Tap send to try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Avatar name={title} uri={summary?.otherPhotoUrl} size={32} />
        <Text variant="label" weight="semibold" numberOfLines={1} style={{ flex: 1 }}>
          {title}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <Text tone="muted" center style={{ marginTop: Spacing.seven }}>
              Say hello and get the conversation going.
            </Text>
          ) : (
            messages.map((m) => {
              const mine = m.senderId === meId;
              return (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: theme.tint, alignSelf: 'flex-end' }
                      : { backgroundColor: theme.backgroundElement, alignSelf: 'flex-start' },
                  ]}
                >
                  <Text style={{ color: mine ? theme.textInverse : theme.text }}>{m.body}</Text>
                  <Text
                    variant="small"
                    style={{
                      marginTop: 4,
                      color: mine ? theme.textInverse : theme.textMuted,
                      opacity: mine ? 0.8 : 1,
                    }}
                  >
                    {formatClockTime(m.createdAt)}
                  </Text>
                </View>
              );
            })
          )}
          {error ? (
            <Text variant="small" tone="danger" center style={{ marginTop: Spacing.three }}>
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <ChatComposer value={input} onChangeText={setInput} onSend={send} sending={sending} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  messages: {
    padding: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
});
