/** Formats an ISO date (YYYY-MM-DD or full ISO) as a short, friendly label. */
export function formatDueDate(date?: string | null): string {
  if (!date) return '';
  const d = new Date(date.length === 10 ? `${date}T00:00:00` : date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** True when a non-empty due date is strictly in the past (by day). */
export function isOverdue(date?: string | null): boolean {
  if (!date) return false;
  const d = new Date(date.length === 10 ? `${date}T00:00:00` : date);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}
