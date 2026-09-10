import { formatTime12h, formatTimingRange12h } from '@/lib/formatBusinessHours';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

type DaySlot = {
  open: string;
  close: string;
  isClosed: boolean;
  is24Hours: boolean;
};

export type BusinessOpenState = {
  status: 'Open' | 'Closed';
  label: string;
  colorClass: string;
  dotClass: string;
};

function parseTimeToMinutes(time: string): number | null {
  const normalized = time.trim();
  if (!normalized) return null;

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

function normalizeDayTiming(raw: unknown): DaySlot | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const text = raw.toLowerCase();
    if (text.includes('24') && text.includes('open')) {
      return { open: '00:00', close: '23:59', isClosed: false, is24Hours: true };
    }
    if (raw === 'Closed' || !raw.includes('-')) {
      return { open: '', close: '', isClosed: true, is24Hours: false };
    }
    const [open, close] = raw.split('-').map((part) => part.trim());
    if (!open || !close) return null;
    const is24Hours =
      open === '00:00' && (close === '23:59' || close === '24:00' || close === '00:00');
    return { open, close, isClosed: false, is24Hours };
  }

  if (typeof raw === 'object' && raw !== null) {
    const slot = raw as {
      open?: string;
      close?: string;
      isClosed?: boolean;
      is24Hours?: boolean;
    };
    if (slot.isClosed) {
      return { open: '', close: '', isClosed: true, is24Hours: false };
    }
    if (slot.is24Hours) {
      return { open: '00:00', close: '23:59', isClosed: false, is24Hours: true };
    }
    if (slot.open && slot.close) {
      const is24Hours =
        slot.open === '00:00' &&
        (slot.close === '23:59' || slot.close === '24:00' || slot.close === '00:00');
      return { open: slot.open, close: slot.close, isClosed: false, is24Hours };
    }
  }

  return null;
}

function closedState(message = 'Closed now'): BusinessOpenState {
  return {
    status: 'Closed',
    label: message,
    colorClass: 'text-rose-600',
    dotClass: 'bg-rose-500',
  };
}

function openState(closeTime: string, is24Hours = false): BusinessOpenState {
  return {
    status: 'Open',
    label: is24Hours ? 'Open now · Open 24 hours' : `Open now · Open till ${formatTime12h(closeTime)}`,
    colorClass: 'text-emerald-600',
    dotClass: 'bg-emerald-500',
  };
}

function isOpenNow(open: string, close: string, currentMinutes: number): boolean {
  const openMinutes = parseTimeToMinutes(open);
  const closeMinutes = parseTimeToMinutes(close);
  if (openMinutes === null || closeMinutes === null) return false;

  if (closeMinutes === openMinutes) {
    return false;
  }
  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  // Overnight hours (e.g. 22:00 – 02:00)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}

function buildClosedLabel(timings: Record<string, unknown>, now: Date): string {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayName = WEEKDAYS[now.getDay()];
  const todaySlot = normalizeDayTiming(timings[todayName]);

  if (todaySlot && !todaySlot.isClosed && todaySlot.open) {
    if (todaySlot.is24Hours) {
      return 'Closed now';
    }
    const openMinutes = parseTimeToMinutes(todaySlot.open);
    if (openMinutes !== null && currentMinutes < openMinutes) {
      return `Closed now, opens ${formatTime12h(todaySlot.open)}`;
    }
  }

  for (let offset = 1; offset <= 7; offset++) {
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + offset);
    const dayName = WEEKDAYS[nextDate.getDay()];
    const slot = normalizeDayTiming(timings[dayName]);

    if (!slot || slot.isClosed || !slot.open) continue;

    if (slot.is24Hours) {
      if (offset === 1) {
        return 'Closed now, opens tomorrow';
      }
      return `Closed now, opens ${dayName}`;
    }

    const openLabel = formatTime12h(slot.open);
    if (offset === 1) {
      return `Closed now, opens ${openLabel} tomorrow`;
    }
    return `Closed now, opens ${openLabel} ${dayName}`;
  }

  return 'Closed now';
}

function getStatusForSlot(
  timings: Record<string, unknown>,
  slot: DaySlot,
  now: Date,
  currentMinutes: number
): BusinessOpenState {
  if (slot.isClosed || !slot.open || !slot.close) {
    return closedState(buildClosedLabel(timings, now));
  }

  if (slot.is24Hours) {
    return openState(slot.close, true);
  }

  return isOpenNow(slot.open, slot.close, currentMinutes)
    ? openState(slot.close)
    : closedState(buildClosedLabel(timings, now));
}

export function getBusinessOpenStatus(timings: unknown): BusinessOpenState {
  if (!timings || typeof timings !== 'object') {
    return {
      status: 'Closed',
      label: 'Hours not listed',
      colorClass: 'text-slate-500',
      dotClass: 'bg-slate-400',
    };
  }

  const record = timings as Record<string, unknown>;
  const now = new Date();
  const day = WEEKDAYS[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todaySlot = normalizeDayTiming(record[day]);

  if (!todaySlot) {
    return closedState(buildClosedLabel(record, now));
  }

  return getStatusForSlot(record, todaySlot, now, currentMinutes);
}

const WEEKDAYS_MONDAY_FIRST = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function dayTiming(timings: Record<string, unknown>, day: string): unknown {
  return (
    timings[day] ??
    timings[day.toLowerCase()] ??
    timings[day.toUpperCase()] ??
    timings[day.slice(0, 3)] ??
    timings[Object.keys(timings).find((key) => key.toLowerCase() === day.toLowerCase()) || ''] ??
    null
  );
}

export type WeekDayHours = {
  day: string;
  hours: string;
  isToday: boolean;
};

export function getWeeklyHours(timings: unknown): WeekDayHours[] {
  if (!timings || typeof timings !== 'object') return [];
  const record = timings as Record<string, unknown>;
  if (Object.keys(record).length === 0) return [];

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return WEEKDAYS_MONDAY_FIRST.map((day) => ({
    day,
    hours: formatTimingRange12h(dayTiming(record, day)),
    isToday: day === todayName,
  }));
}
