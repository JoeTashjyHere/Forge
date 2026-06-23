import { Badge } from '@/components/ui/Badge';
import { PERSONAL_BUILD_STAGES, PROJECT_STAGES } from '@/lib/constants';

const STAGE_COLORS: Record<string, string> = {
  ...Object.fromEntries(PERSONAL_BUILD_STAGES.map((s) => [s.key, s.color])),
  ...Object.fromEntries(PROJECT_STAGES.map((s) => [s.key, s.color])),
};

export function BuildStageBadge({ stage }: { stage?: string | null }) {
  if (!stage) return null;
  return <Badge label={stage} color={STAGE_COLORS[stage] ?? undefined} />;
}
