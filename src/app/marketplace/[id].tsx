import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { formatDueDate } from '@/lib/dates';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/authStore';
import { useLaunchStore } from '@/store/launchStore';
import { useMembershipStore } from '@/store/membershipStore';

export default function LaunchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const feed = useLaunchStore((s) => s.feed);
  const loadFeed = useLaunchStore((s) => s.loadFeed);
  const loadedFeed = useLaunchStore((s) => s.loadedFeed);
  const toggleFollow = useLaunchStore((s) => s.toggleFollow);
  const isFollowing = useLaunchStore((s) => s.isFollowing);
  const followerCount = useLaunchStore((s) => s.followerCount);

  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const launch = feed.find((l) => l.id === id);
  const members = useMembershipStore((s) => (launch ? s.membersByProject[launch.projectId] ?? [] : []));
  const activeMembers = members.filter((m) => m.membershipStatus === 'active');

  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loadedFeed) void loadFeed(profile?.id);
  }, [loadedFeed, loadFeed, profile?.id]);

  useEffect(() => {
    if (launch) void loadMembers(launch.projectId);
  }, [launch, loadMembers]);

  if (!loadedFeed && !launch) {
    return (
      <Screen edges={['top']}>
        <LoadingState label="Loading launch…" />
      </Screen>
    );
  }

  if (!launch) {
    return (
      <Screen edges={['top']}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h3" style={{ marginTop: Spacing.five }}>
          Launch not found
        </Text>
      </Screen>
    );
  }

  const following = isFollowing(launch.id);
  const date = launch.launchDate ?? launch.createdAt;

  const follow = async () => {
    if (!profile?.id || busy) return;
    setBusy(true);
    try {
      await toggleFollow(launch.id, profile.id);
    } finally {
      setBusy(false);
    }
  };

  const openUrl = (url: string) => {
    void Linking.openURL(url).catch(() => {});
  };

  return (
    <Screen edges={['top']}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: Spacing.four }}>
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>

      <Text variant="h1">{launch.launchTitle}</Text>
      <View style={styles.badges}>
        {launch.projectStage ? <BuildStageBadge stage={launch.projectStage} /> : null}
        {date ? (
          <Text variant="small" tone="muted">
            Launched {formatDueDate(date)}
          </Text>
        ) : null}
      </View>

      {launch.launchDescription ? (
        <Text tone="secondary" style={styles.block}>
          {launch.launchDescription}
        </Text>
      ) : null}

      {/* Screenshots placeholder */}
      <View style={[styles.screenshot, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Ionicons name="image-outline" size={28} color={theme.textMuted} />
        <Text variant="small" tone="muted">
          Screenshots coming soon
        </Text>
      </View>

      {/* Links */}
      {launch.websiteUrl || launch.videoUrl ? (
        <View style={[styles.block, styles.linkRow]}>
          {launch.websiteUrl ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Visit website"
                variant="secondary"
                size="sm"
                leftIcon={<Ionicons name="globe-outline" size={16} color={theme.tint} />}
                onPress={() => openUrl(launch.websiteUrl!)}
              />
            </View>
          ) : null}
          {launch.videoUrl ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Watch video"
                variant="secondary"
                size="sm"
                leftIcon={<Ionicons name="play-circle-outline" size={16} color={theme.tint} />}
                onPress={() => openUrl(launch.videoUrl!)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Launch story */}
      {launch.launchStory ? (
        <Card padded style={styles.block}>
          <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
            The build story
          </Text>
          <Text>{launch.launchStory}</Text>
        </Card>
      ) : null}

      {/* Team credits */}
      <Card padded style={styles.block}>
        <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.three }}>
          Built by
        </Text>
        {activeMembers.length ? (
          <View style={{ gap: Spacing.three }}>
            {activeMembers.map((m) => (
              <View key={m.id} style={styles.creditRow}>
                <Avatar name={m.displayName ?? 'Builder'} uri={m.profilePhotoUrl} size={36} />
                <View style={{ flex: 1 }}>
                  <Text variant="label" weight="semibold" numberOfLines={1}>
                    {m.displayName ?? 'Builder'}
                  </Text>
                  <Text variant="small" tone="muted">
                    {m.role}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text tone="secondary">
            {launch.projectTitle ? `Built as part of ${launch.projectTitle}.` : 'Built on Forge.'}
          </Text>
        )}
      </Card>

      <View style={styles.followRow}>
        <View>
          <Text variant="h4">{followerCount(launch.id)}</Text>
          <Text variant="small" tone="muted">
            following
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title={following ? 'Following' : 'Follow launch'}
            variant={following ? 'secondary' : 'primary'}
            loading={busy}
            leftIcon={
              following ? <Ionicons name="checkmark" size={16} color={theme.tint} /> : undefined
            }
            onPress={follow}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  block: { marginTop: Spacing.five },
  screenshot: {
    marginTop: Spacing.five,
    height: 160,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  linkRow: { flexDirection: 'row', gap: Spacing.three },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    marginTop: Spacing.six,
  },
});
