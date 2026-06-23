import { Brand } from '@/constants/theme';
import { Badge } from '@/components/ui/Badge';
import type { HealthStatus } from '@/lib/constants';

const HEALTH_COLOR: Record<HealthStatus, string> = {
  Healthy: Brand.success,
  'Needs Attention': Brand.warning,
  'At Risk': Brand.danger,
};

/**
 * Health is shown as status only — the internal numeric score stays hidden.
 * See docs/03_User_Experience.md and docs/08_Design_System.md.
 */
export function ProjectHealthBadge({ status }: { status: HealthStatus }) {
  return <Badge label={status} color={HEALTH_COLOR[status]} dot />;
}
