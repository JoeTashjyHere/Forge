import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChatComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  placeholder?: string;
  sending?: boolean;
}

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  placeholder = 'Type a message…',
  sending,
}: ChatComposerProps) {
  const theme = useTheme();
  const canSend = value.trim().length > 0 && !sending;
  return (
    <View style={[styles.bar, { borderTopColor: theme.border }]}>
      <View style={styles.inner}>
        <View style={{ flex: 1 }}>
          <Input
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={() => canSend && onSend()}
            returnKeyType="send"
          />
        </View>
        <Pressable
          onPress={onSend}
          disabled={!canSend}
          style={[
            styles.sendBtn,
            { backgroundColor: canSend ? theme.tint : theme.backgroundElement },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? theme.textInverse : theme.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  inner: {
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
