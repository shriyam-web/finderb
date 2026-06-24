export const FINDERB_TIMEZONE = 'Asia/Kolkata';

/**
 * Supabase/Postgres often returns `timestamptz` / `timestamp` values without a
 * timezone suffix, e.g. `2026-06-24T06:03:51.885`. Those values are UTC wall
 * clock and must not be parsed as the viewer's local timezone.
 */
export function parseFinderbTimestamp(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed);
  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const iso = hasTimezone ? normalized : `${normalized}Z`;

  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Normalize to ISO UTC for passing through server actions / JSON. */
export function normalizeFinderbTimestamp(value: string | Date | null | undefined): string {
  const date = parseFinderbTimestamp(value);
  return date ? date.toISOString() : '';
}

function toDate(value: string | Date | null | undefined): Date | null {
  return parseFinderbTimestamp(value);
}

/** Full date + time in IST (India). */
export function formatDateTimeInr(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';

  const formatted = date.toLocaleString('en-IN', {
    timeZone: FINDERB_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatted} IST`;
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

/** Activity feed time line, e.g. "11:33 pm IST". */
export function formatActivityTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';

  const formatted = date.toLocaleTimeString('en-IN', {
    timeZone: FINDERB_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${formatted} IST`;
}

/** Pre-formatted activity labels (use on server; avoids client timezone bugs). */
export function formatActivityLabels(value: string | Date | null | undefined) {
  return {
    occurredAt: normalizeFinderbTimestamp(value),
    occurredDateLabel: formatActivityDate(value),
    occurredTimeLabel: formatActivityTime(value),
  };
}
