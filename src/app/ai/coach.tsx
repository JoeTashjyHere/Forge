import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { sendCoachMessage } from '@/lib/ai';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  nextAction?: string;
}

const SUGGESTIONS = [
  'Help me validate my idea',
  'What role should I add to my team?',
  'How do I plan a launch?',
];

export default function AICoach() {
  const router = useRouter();
  const theme = useTheme();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const profile = useAuthStore((s) => s.profile);
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const nextId = (p: string) => `${p}-${(idRef.current += 1)}`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'assistant',
      content:
        "I'm your Forge Build Coach. Tell me what you're working on and I'll help you turn it into a concrete next step.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending || !profile) return;
    const userMsg: ChatMessage = { id: nextId('u'), role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const res = await sendCoachMessage({
        userId: profile.id,
        projectId: projectId ?? null,
        message: trimmed,
      });
      setMessages((m) => [
        ...m,
        { id: nextId('a'), role: 'assistant', content: res.answer, nextAction: res.nextAction },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId('a'),
          role: 'assistant',
          content: 'I had trouble responding just now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles" size={16} color={theme.tint} />
          <Text variant="label" weight="semibold">
            AI Build Coach
          </Text>
        </View>
        <View style={{ width: 26 }} />
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
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubble,
                m.role === 'user'
                  ? { backgroundColor: theme.tint, alignSelf: 'flex-end' }
                  : { backgroundColor: theme.backgroundElement, alignSelf: 'flex-start' },
              ]}
            >
              <Text style={{ color: m.role === 'user' ? theme.textInverse : theme.text }}>
                {m.content}
              </Text>
              {m.nextAction ? (
                <View style={[styles.nextAction, { borderTopColor: theme.border }]}>
                  <Text variant="small" tone="tint" weight="semibold">
                    NEXT STEP
                  </Text>
                  <Text variant="caption">{m.nextAction}</Text>
                </View>
              ) : null}
            </View>
          ))}
          {sending ? (
            <View style={[styles.bubble, { backgroundColor: theme.backgroundElement }]}>
              <Text tone="muted">Thinking…</Text>
            </View>
          ) : null}

          {messages.length <= 1 ? (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  style={[styles.suggestion, { borderColor: theme.border }]}
                >
                  <Text variant="caption" tone="tint">
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputBar, { borderTopColor: theme.border }]}>
          <View style={styles.inputInner}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Ask your coach…"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send(input)}
                returnKeyType="send"
              />
            </View>
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || sending}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() ? theme.tint : theme.backgroundElement },
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={input.trim() ? theme.textInverse : theme.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  messages: {
    padding: Spacing.five,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: Radius.large,
    padding: Spacing.four,
  },
  nextAction: {
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  suggestions: { gap: Spacing.two, marginTop: Spacing.three },
  suggestion: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    alignSelf: 'flex-start',
  },
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
