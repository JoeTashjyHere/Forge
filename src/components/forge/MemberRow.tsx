import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';
import { Spacing } from '@/constants/theme';
import { MEMBER_STATUSES } from '@/lib/constants';
import { formatDueDate } from '@/lib/dates';
import type { ProjectMember } from '@/types/project';

interface MemberRowProps {
  member: ProjectMember;
  /** When true, hides the status badge (e.g. for active-only lists). */
  hideStatus?: boolean;
  isYou?: boolean;
  children?: ReactNode;
}

export function MemberRow({ member, hideStatus, isYou, children }: MemberRowProps) {
  const statusMeta = MEMBER_STATUSES.find((s) => s.key === member.membershipStatus);
  return (
    <View style={styles.row}>
      <Avatar name={member.displayName ?? 'Builder'} uri={member.profilePhotoUrl} size={44} />
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text variant="label" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
            {member.displayName ?? 'Builder'}
          </Text>
          {isYou ? (
            <Text variant="small" tone="muted">
              You
            </Text>
          ) : null}
        </View>
        <View style={styles.metaLine}>
          <Badge label={member.role} variant="outline" />
          {!hideStatus && statusMeta ? (
            <Badge label={statusMeta.label} color={statusMeta.color} dot />
          ) : null}
          {member.joinedAt ? (
            <Text variant="small" tone="muted">
              {formatDueDate(member.joinedAt)}
            </Text>
          ) : null}
        </View>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  body: { flex: 1, gap: 4 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  metaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
