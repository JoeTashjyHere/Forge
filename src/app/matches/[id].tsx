import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fullName } from '@/lib/profile';
import { SAMPLE_BUILDERS } from '@/lib/sampleData';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useMessagingStore } from '@/store/messagingStore';
import { useProjectStore } from '@/store/projectStore';

export default function BuilderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const startConversation = useMessagingStore((s) => s.startConversation);
  const myProjects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.load);
  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const inviteBuilder = useMembershipStore((s) => s.inviteBuilder);
  const [starting, setStarting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitedTo, setInvitedTo] = useState<string | null>(null);
  const builder = SAMPLE_BUILDERS.find((b) => b.userId === id);

  useEffect(() => {
    if (profile?.id) void loadProjects(profile.id);
  }, [profile?.id, loadProjects]);

  const message = async () => {
    if (!builder || !profile?.id || starting) return;
    setStarting(true);
    try {
      const convId = await startConversation(profile.id, {
        id: builder.userId,
        name: builder.displayName,
        photoUrl: builder.profilePhotoUrl,
      });
      router.push(`/messages/${convId}?name=${encodeURIComponent(builder.displayName)}`);
    } finally {
      setStarting(false);
    }
  };

  const invite = async (projectId: string, projectTitle: string) => {
    if (!builder || !profile) return;
    const ownerUser = { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl };
    await loadMembers(projectId, ownerUser);
    await inviteBuilder(
      projectId,
      { id: builder.userId, name: builder.displayName, photoUrl: builder.profilePhotoUrl },
      'Contributor',
    );
    setInviteOpen(false);
    setInvitedTo(projectTitle);
  };

  if (!builder) {
    return (
      <Screen edges={['top']}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h3" style={{ marginTop: Spacing.five }}>
          Builder not found
        </Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: Spacing.four }}>
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>

      <View style={styles.header}>
        <Avatar name={builder.displayName} uri={builder.profilePhotoUrl} size={88} />
        <Text variant="h3" style={{ marginTop: Spacing.three }}>
          {builder.displayName}
        </Text>
        {builder.occupation ? <Text tone="secondary">{builder.occupation}</Text> : null}
        <View style={styles.badges}>
          {builder.archetype ? <Badge label={builder.archetype} /> : null}
          <BuildStageBadge stage={builder.buildStage} />
        </View>
        <Text variant="h2" tone="tint" weight="bold" style={{ marginTop: Spacing.three }}>
          {builder.matchScore}% match
        </Text>
      </View>

      <Card padded style={styles.block}>
        <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
          Why this match
        </Text>
        {builder.reasons.map((r) => (
          <View key={r} style={styles.reasonRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text variant="caption" style={{ flex: 1 }}>
              {r}
            </Text>
          </View>
        ))}
      </Card>

      <Card padded style={styles.block}>
        <Text variant="label" tone="secondary" style={{ marginBottom: Spacing.two }}>
          Skills
        </Text>
        <View style={styles.chips}>
          {builder.skills.map((s) => (
            <Badge key={s} label={s} variant="outline" />
          ))}
        </View>
      </Card>

      {invitedTo ? (
        <Card padded style={{ ...styles.block, borderColor: theme.success, borderWidth: 1 }}>
          <Text variant="caption" tone="secondary">
            Invited {builder.displayName.split(' ')[0]} to {invitedTo}.
          </Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={`Message ${builder.displayName.split(' ')[0]}`}
          loading={starting}
          onPress={message}
        />
        {myProjects.length ? (
          <Button title="Invite to a project" variant="secondary" onPress={() => setInviteOpen(true)} />
        ) : null}
      </View>

      <Sheet visible={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite to a project">
        <Text tone="secondary" style={{ marginBottom: Spacing.four }}>
          Choose a project to invite {builder.displayName.split(' ')[0]} to as a contributor.
        </Text>
        <View style={{ gap: Spacing.three }}>
          {myProjects.map((p) => (
            <Pressable key={p.id} onPress={() => invite(p.id, p.title)}>
              <Card padded>
                <View style={styles.projectRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="label" weight="semibold" numberOfLines={1}>
                      {p.title}
                    </Text>
                    <Text variant="small" tone="muted">
                      {p.stage}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={22} color={theme.tint} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center' },
  badges: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  block: { marginTop: Spacing.five },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actions: { marginTop: Spacing.six, gap: Spacing.three },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
