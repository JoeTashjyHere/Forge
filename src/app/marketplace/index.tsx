import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LaunchCard } from '@/components/forge/LaunchCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useLaunchStore } from '@/store/launchStore';

export default function Marketplace() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const feed = useLaunchStore((s) => s.feed);
  const loadFeed = useLaunchStore((s) => s.loadFeed);
  const followerCount = useLaunchStore((s) => s.followerCount);

  useEffect(() => {
    void loadFeed(profile?.id);
  }, [loadFeed, profile?.id]);

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">Launches</Text>
        <View style={{ width: 26 }} />
      </View>

      <Text tone="secondary" style={{ marginBottom: Spacing.five }}>
        Products shipped by builders on Forge.
      </Text>

      {feed.length === 0 ? (
        <Card padded>
          <EmptyState
            icon="rocket-outline"
            title="No launches yet"
            description="No launches yet — be the first to ship something on Forge."
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {feed.map((l) => (
            <LaunchCard
              key={l.id}
              launch={l}
              followerCount={followerCount(l.id)}
              onPress={() => router.push(`/marketplace/${l.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  list: { gap: Spacing.three },
});
