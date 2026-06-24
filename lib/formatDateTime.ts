export const FINDERB_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * DB timestamps arrive without timezone, e.g. `2026-06-24T18:03:51.885`.
 * They are UTC — add +5:30 for IST display.
 */
export function parseFinderbTimestamp(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/
  );
  if (match) {
    const [, year, month, day, hour, minute, second, ms = '0'] = match;
    const utcMs = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(ms.padEnd(3, '0').slice(0, 3))
    );
    return new Date(utcMs);
  }

  const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const date = new Date(`${normalized}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Normalize to ISO UTC for JSON / server actions. */
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

/** Activity feed time line in IST (+5:30). */
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

/** Pre-formatted activity labels (server-side). */
export function formatActivityLabels(value: string | Date | null | undefined) {
  return {
    occurredAt: normalizeFinderbTimestamp(value),
    occurredDateLabel: formatActivityDate(value),
    occurredTimeLabel: formatActivityTime(value),
  };
}

export { IST_OFFSET_MS };
