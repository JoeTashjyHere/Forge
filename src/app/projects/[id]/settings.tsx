import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MemberRow } from '@/components/forge/MemberRow';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { ASSIGNABLE_ROLES, type ProjectRole } from '@/lib/constants';
import { useTheme } from '@/hooks/use-theme';
import { canManageMembers, isLastOwner } from '@/lib/permissions';
import { fullName } from '@/lib/profile';
import { useAuthStore } from '@/store/authStore';
import { useMembershipStore } from '@/store/membershipStore';
import { useProjectStore } from '@/store/projectStore';

const ROLE_OPTIONS = ASSIGNABLE_ROLES.map((r) => ({ key: r, label: r }));

export default function ProjectSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);

  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const loadProjects = useProjectStore((s) => s.load);
  const projectsLoaded = useProjectStore((s) => s.loaded);

  const members = useMembershipStore((s) => s.membersByProject[id!] ?? []);
  const loadMembers = useMembershipStore((s) => s.loadMembers);
  const respondToRequest = useMembershipStore((s) => s.respondToRequest);
  const updateRole = useMembershipStore((s) => s.updateRole);
  const removeMember = useMembershipStore((s) => s.removeMember);

  const [error, setError] = useState<string | null>(null);

  const isOwner = project?.ownerId === profile?.id;
  const canManage = project && profile ? canManageMembers(project, profile.id, members) : false;

  useEffect(() => {
    if (!projectsLoaded && profile?.id) void loadProjects(profile.id);
  }, [projectsLoaded, profile?.id, loadProjects]);

  useEffect(() => {
    if (!id) return;
    const ownerUser =
      isOwner && profile
        ? { id: profile.id, name: fullName(profile), photoUrl: profile.profilePhotoUrl }
        : undefined;
    void loadMembers(id, ownerUser);
  }, [id, isOwner, profile, loadMembers]);

  const active = members.filter((m) => m.membershipStatus === 'active');
  const pending = members.filter((m) => m.membershipStatus === 'pending');
  const invited = members.filter((m) => m.membershipStatus === 'invited');

  const guarded = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text variant="h4">Members</Text>
        <View style={{ width: 26 }} />
      </View>

      {error ? (
        <Card padded style={{ marginBottom: Spacing.four }}>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </Card>
      ) : null}

      {members.length === 0 ? (
        <Card padded>
          <EmptyState
            icon="people-outline"
            title="No teammates yet"
            description="No teammates yet — invite collaborators or accept join requests to start building together."
          />
        </Card>
      ) : null}

      {/* Pending requests */}
      {canManage && pending.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Join requests (${pending.length})`} />
          <View style={styles.list}>
            {pending.map((m) => (
              <Card key={m.id} padded>
                <MemberRow member={m} hideStatus />
                <View style={styles.actionRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Decline"
                      size="sm"
                      variant="ghost"
                      onPress={() => guarded(() => respondToRequest(id!, m.id, false))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      title="Accept"
                      size="sm"
                      onPress={() => guarded(() => respondToRequest(id!, m.id, true))}
                    />
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* Active members */}
      <View style={styles.section}>
        <SectionHeader title={`Team (${active.length})`} />
        <View style={styles.list}>
          {active.map((m) => {
            const you = m.userId === profile?.id;
            const lastOwner = isLastOwner(members, m);
            return (
              <Card key={m.id} padded>
                <MemberRow member={m} hideStatus isYou={you} />
                {canManage && !you && m.role !== 'Owner' ? (
                  <View style={styles.manageRow}>
                    <View style={{ flex: 1 }}>
                      <Segmented<ProjectRole>
                        options={ROLE_OPTIONS}
                        value={m.role}
                        onChange={(role) => guarded(() => updateRole(id!, m.id, role))}
                      />
                    </View>
                    <Pressable
                      onPress={() => guarded(() => removeMember(id!, m.id))}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </Pressable>
                  </View>
                ) : null}
                {canManage && !you && m.role === 'Owner' && !lastOwner ? (
                  <View style={styles.manageRow}>
                    <Pressable
                      onPress={() => guarded(() => removeMember(id!, m.id))}
                      hitSlop={8}
                      style={styles.removeBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      </View>

      {/* Invited */}
      {canManage && invited.length ? (
        <View style={styles.section}>
          <SectionHeader title={`Invited (${invited.length})`} />
          <View style={styles.list}>
            {invited.map((m) => (
              <Card key={m.id} padded>
                <MemberRow member={m} />
                <View style={styles.manageRow}>
                  <Button
                    title="Cancel invite"
                    size="sm"
                    variant="ghost"
                    onPress={() => guarded(() => removeMember(id!, m.id))}
                  />
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
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
  section: { marginTop: Spacing.five },
  list: { gap: Spacing.three },
  actionRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  removeBtn: { padding: Spacing.two },
});
