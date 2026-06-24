import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BuildStageBadge } from '@/components/forge/BuildStageBadge';
import { ModeBanner } from '@/components/forge/ModeBanner';
import { SectionHeader } from '@/components/forge/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isAdminUser } from '@/lib/admin';
import { NEW_USER_STATUS } from '@/lib/constants';
import { fullName } from '@/lib/profile';
import { getProfileDetails } from '@/lib/profileDetails';
import { useAuthStore } from '@/store/authStore';

export default function ProfileTab() {
  const router = useRouter();
  const theme = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const { data: details, isLoading } = useQuery({
    queryKey: ['profile-details', profile?.id],
    queryFn: () => getProfileDetails(profile!.id),
    enabled: !!profile?.id,
  });

  if (!profile) {
    return (
      <Screen scroll={false}>
        <LoadingState label="Loading profile" />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={fullName(profile)} uri={profile.profilePhotoUrl} size={84} />
        <Text variant="h3" style={{ marginTop: Spacing.three }}>
          {fullName(profile)}
        </Text>
        {profile.occupation ? <Text tone="secondary">{profile.occupation}</Text> : null}
        {profile.location ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
            <Text variant="caption" tone="muted">
              {profile.location}
            </Text>
          </View>
        ) : null}
        <View style={styles.badges}>
          {profile.builderArchetype ? <Badge label={profile.builderArchetype} /> : null}
          <BuildStageBadge stage={profile.buildStage} />
        </View>
        <View style={[styles.statusPill, { borderColor: theme.borderStrong }]}>
          <Ionicons name="ribbon-outline" size={14} color={theme.textSecondary} />
          <Text variant="small" tone="secondary">
            {NEW_USER_STATUS}
          </Text>
        </View>
        <View style={styles.editBtn}>
          <Button
            title="Edit profile"
            variant="secondary"
            fullWidth={false}
            onPress={() => router.push('/profile/edit')}
          />
        </View>
      </View>

      {profile.bio ? (
        <View style={styles.section}>
          <SectionHeader title="About" />
          <Text tone="secondary">{profile.bio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Details" />
        <Card padded>
          <DetailRow icon="briefcase-outline" label="Occupation" value={profile.occupation} />
          <DetailRow
            icon="time-outline"
            label="Availability"
            value={profile.availability ? `${profile.availability} hrs / week` : null}
          />
          <DetailRow icon="globe-outline" label="Timezone" value={profile.timezone} />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Skills" />
        {isLoading ? (
          <Text tone="muted" variant="caption">
            Loading…
          </Text>
        ) : details?.skills.length ? (
          <View style={styles.chips}>
            {details.skills.map((s) => (
              <Chip key={s.name} label={`${s.name} · ${s.proficiency}`} />
            ))}
          </View>
        ) : (
          <Text tone="muted" variant="caption">
            No skills added yet.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Interests" />
        {details?.interests.length ? (
          <View style={styles.chips}>
            {details.interests.map((i) => (
              <Chip key={i} label={i} />
            ))}
          </View>
        ) : (
          <Text tone="muted" variant="caption">
            No interests added yet.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="About" />
        <View style={styles.modeRow}>
          <ModeBanner />
        </View>
        <Card padded>
          <LinkRow label="Share feedback" onPress={() => router.push('/feedback')} />
          <LinkRow label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
          <LinkRow label="Terms of Service" onPress={() => router.push('/legal/terms')} />
          {isAdminUser(profile) ? (
            <LinkRow label="Beta admin" onPress={() => router.push('/beta/admin')} />
          ) : null}
        </Card>
      </View>

      <View style={[styles.section, { marginBottom: Spacing.seven }]}>
        <Button
          title="Sign out"
          variant="ghost"
          onPress={async () => {
            await signOut();
            router.replace('/landing');
          }}
        />
      </View>
    </Screen>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <Text variant="caption" tone="tint" weight="semibold" style={{ flex: 1 }}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
}) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={theme.textMuted} />
      <Text variant="caption" tone="muted" style={{ width: 96 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1 }}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.one },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, marginTop: Spacing.one },
  badges: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginTop: Spacing.three,
  },
  editBtn: { marginTop: Spacing.four },
  section: { marginTop: Spacing.six },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  modeRow: { flexDirection: 'row', marginBottom: Spacing.three },
});
