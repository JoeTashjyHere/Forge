import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ModeBanner } from '@/components/forge/ModeBanner';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isAdminUser } from '@/lib/admin';
import { formatRelativeTime } from '@/lib/dates';
import { useAuthStore } from '@/store/authStore';
import { useBetaStore } from '@/store/betaStore';
import type { BetaInviteStatus } from '@/types/beta';

const STATUS_OPTIONS: { key: BetaInviteStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#3B82F6' },
  { key: 'invited', label: 'Invited', color: '#F59E0B' },
  { key: 'onboarded', label: 'Onboarded', color: '#10B981' },
  { key: 'rejected', label: 'Rejected', color: '#EF4444' },
];

export default function BetaAdmin() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const admin = isAdminUser(profile);

  const invites = useBetaStore((s) => s.invites);
  const feedback = useBetaStore((s) => s.feedback);
  const loaded = useBetaStore((s) => s.loaded);
  const loadAdminData = useBetaStore((s) => s.loadAdminData);
  const updateInviteStatus = useBetaStore((s) => s.updateInviteStatus);

  useEffect(() => {
    if (admin) void loadAdminData();
  }, [admin, loadAdminData]);

  if (!admin) {
    return (
      <Screen>
        <Header title="Beta Admin" onBack={() => router.back()} theme={theme} />
        <EmptyState
          icon="lock-closed-outline"
          title="Admins only"
          description="This area is restricted to Forge admins. Ask to be added to the admin allowlist if you need access."
        />
      </Screen>
    );
  }

  const counts = STATUS_OPTIONS.map((s) => ({
    ...s,
    n: invites.filter((i) => i.status === s.key).length,
  }));

  return (
    <Screen>
      <Header title="Beta Admin" onBack={() => router.back()} theme={theme} />
      <View style={styles.modeRow}>
        <ModeBanner />
      </View>

      <View style={styles.statRow}>
        {counts.map((c) => (
          <Card key={c.key} padded style={styles.statCard}>
            <Text variant="h3" weight="bold" style={{ color: c.color }}>
              {c.n}
            </Text>
            <Text variant="small" tone="secondary">
              {c.label}
            </Text>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeader title={`Invite requests (${invites.length})`} />
        {!loaded ? (
          <Text tone="muted" variant="caption">
            Loading…
          </Text>
        ) : invites.length === 0 ? (
          <EmptyState
            icon="mail-outline"
            title="No submissions yet"
            description="Beta signups from the /beta page will appear here."
          />
        ) : (
          <View style={styles.list}>
            {invites.map((inv) => (
              <Card key={inv.id} padded>
                <View style={styles.inviteTop}>
                  <View style={{ flex: 1 }}>
                    <Text weight="semibold">{inv.name}</Text>
                    <Text variant="small" tone="secondary">
                      {inv.email}
                    </Text>
                  </View>
                  <Text variant="small" tone="muted">
                    {formatRelativeTime(inv.createdAt)}
                  </Text>
                </View>
                {inv.role ? (
                  <Text variant="caption" tone="secondary" style={styles.metaLine}>
                    {inv.builderType ? `${inv.builderType} · ` : ''}
                    {inv.role}
                  </Text>
                ) : null}
                {inv.building ? (
                  <Text variant="caption" style={styles.building}>
                    {inv.building}
                  </Text>
                ) : null}
                <View style={styles.statusRow}>
                  <Segmented
                    wrap
                    value={inv.status}
                    onChange={(s) => void updateInviteStatus(inv.id, s)}
                    options={STATUS_OPTIONS.map((s) => ({ key: s.key, label: s.label, color: s.color }))}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, { marginBottom: Spacing.seven }]}>
        <SectionHeader title={`Feedback (${feedback.length})`} />
        {feedback.length === 0 ? (
          <EmptyState
            icon="chatbox-ellipses-outline"
            title="No feedback yet"
            description="Responses from the in-app feedback form will appear here."
          />
        ) : (
          <View style={styles.list}>
            {feedback.map((f) => (
              <Card key={f.id} padded>
                <View style={styles.inviteTop}>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Ionicons
                        key={n}
                        name={n <= (f.rating ?? 0) ? 'star' : 'star-outline'}
                        size={14}
                        color={theme.tint}
                      />
                    ))}
                    {f.wouldUseAgain !== null ? (
                      <Text variant="small" tone="secondary" style={{ marginLeft: Spacing.two }}>
                        {f.wouldUseAgain ? 'Would use again' : 'Would not use again'}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="small" tone="muted">
                    {formatRelativeTime(f.createdAt)}
                  </Text>
                </View>
                {f.whatWorked ? <FeedbackLine label="Worked" value={f.whatWorked} /> : null}
                {f.whatConfused ? <FeedbackLine label="Confused" value={f.whatConfused} /> : null}
                {f.whatExpected ? <FeedbackLine label="Expected" value={f.whatExpected} /> : null}
              </Card>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function Header({
  title,
  onBack,
  theme,
}: {
  title: string;
  onBack: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.headerBar}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={theme.text} />
      </Pressable>
      <Text variant="label" tone="secondary" style={{ flex: 1 }}>
        {title}
      </Text>
    </View>
  );
}

function FeedbackLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fbLine}>
      <Text variant="small" tone="tint" weight="semibold">
        {label}
      </Text>
      <Text variant="caption" tone="secondary">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.three },
  modeRow: { flexDirection: 'row', marginBottom: Spacing.four },
  statRow: { flexDirection: 'row', gap: Spacing.two },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  section: { marginTop: Spacing.six },
  list: { gap: Spacing.three },
  inviteTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  metaLine: { marginTop: Spacing.two },
  building: { marginTop: Spacing.two },
  statusRow: { marginTop: Spacing.three },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 },
  fbLine: { marginTop: Spacing.three, gap: 2 },
});
