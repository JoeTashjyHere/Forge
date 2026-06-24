import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { ChatComposer } from '@/components/forge/ChatComposer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClockTime } from '@/lib/dates';
import { fullName } from '@/lib/profile';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useMessagingStore } from '@/store/messagingStore';
import { useProjectStore } from '@/store/projectStore';

export default function WorkspaceChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const scrollRef = useRef<ScrollView>(null);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const messages = useMessagingStore((s) => s.workspaceByProject[id!] ?? []);
  const loadWorkspaceMessages = useMessagingStore((s) => s.loadWorkspaceMessages);
  const sendWorkspaceMessage = useMessagingStore((s) => s.sendWorkspaceMessage);
  const subscribeWorkspace = useMessagingStore((s) => s.subscribeWorkspace);

  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const projectMembers = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const activeMembers = projectMembers.filter((m) => m.membershipStatus === 'active');

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sender = useMemo(
    () =>
      profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : null,
    [profile],
  );

  useEffect(() => {
    if (!id) return;
    void loadWorkspaceMessages(id);
    const ownerUser =
      project?.ownerId === profile?.id && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
    const unsub = subscribeWorkspace(id);
    return unsub;
  }, [id, loadWorkspaceMessages, subscribeWorkspace, loadMembers, project?.ownerId, profile]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !id || !sender) return;
    setInput('');
    setSending(true);
    setError(null);
    try {
      await sendWorkspaceMessage(id, sender, text);
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
        <View style={{ flex: 1 }}>
          <Text variant="label" weight="semibold" numberOfLines={1}>
            Team chat
          </Text>
          <Text variant="small" tone="muted" numberOfLines={1}>
            {project?.title ?? 'Workspace'} · {activeMembers.length} member
            {activeMembers.length === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={styles.presence}>
          {activeMembers.slice(0, 4).map((m) => (
            <Avatar key={m.id} name={m.displayName ?? 'Builder'} uri={m.profilePhotoUrl} size={28} />
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <EmptyState
              icon="chatbubbles-outline"
              title="No messages yet"
              description="No messages yet — start the conversation and get the team moving."
            />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => {
              const mine = m.senderId === profile?.id;
              return (
                <View key={m.id} style={styles.msgRow}>
                  <Avatar name={m.senderName} uri={m.senderPhotoUrl} size={32} />
                  <View style={styles.msgBody}>
                    <View style={styles.msgMeta}>
                      <Text variant="small" weight="semibold">
                        {mine ? 'You' : m.senderName}
                      </Text>
                      <Text variant="small" tone="muted">
                        {formatClockTime(m.createdAt)}
                      </Text>
                    </View>
                    <View style={[styles.bubble, { backgroundColor: theme.backgroundElement }]}>
                      <Text>{m.body}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
            {error ? (
              <Text variant="small" tone="danger" style={{ marginTop: Spacing.three }}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
        )}

        <ChatComposer
          value={input}
          onChangeText={setInput}
          onSend={send}
          sending={sending}
          placeholder="Message your team…"
        />
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
  presence: { flexDirection: 'row', gap: -6 },
  empty: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.five },
  messages: {
    padding: Spacing.five,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  msgRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  msgBody: { flex: 1, gap: 4 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  bubble: { borderRadius: Radius.large, padding: Spacing.three, alignSelf: 'flex-start' },
});
