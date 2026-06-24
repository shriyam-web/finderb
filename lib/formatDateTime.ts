export const FINDERB_TIMEZONE = 'Asia/Kolkata';

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Full date + time in IST (India). */
export function formatDateTimeInr(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleString('en-IN', {
    timeZone: FINDERB_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Activity feed date line, e.g. "Jun 24". */
export function formatActivityDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleDateString('en-IN', {
    timeZone: FINDERB_TIMEZONE,
    month: 'short',
    day: 'numeric',
  });
}

/** Activity feed time line, e.g. "02:29 PM". */
export function formatActivityTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';

  return date.toLocaleTimeString('en-IN', {
    timeZone: FINDERB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
