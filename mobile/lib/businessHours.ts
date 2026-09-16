type OpenStatus = {
  status: 'Open' | 'Closed' | 'Unknown';
  label: string;
};

type DaySlot = {
  open: string;
  close: string;
  isClosed: boolean;
  is24Hours: boolean;
};

const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

function dayEntry(timings: unknown, day: string): unknown {
  if (!timings || typeof timings !== 'object') return null;
  const obj = timings as Record<string, unknown>;
  return (
    obj[day] ??
    obj[day.slice(0, 3)] ??
    obj[day.toUpperCase()] ??
    obj[Object.keys(obj).find((k) => k.toLowerCase() === day) || ''] ??
    null
  );
}

function looksLike24Hours(open: string, close: string): boolean {
  if (open === '00:00' && (close === '23:59' || close === '24:00')) return true;
  return open === '00:00' && close === '00:00';
}

function normalizeDaySlot(entry: unknown): DaySlot | null {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const text = entry.toLowerCase();
    if (text.includes('closed')) {
      return { open: '', close: '', isClosed: true, is24Hours: false };
    }
    if (text.includes('24') && text.includes('open')) {
      return { open: '00:00', close: '23:59', isClosed: false, is24Hours: true };
    }
    const parts = entry.split(/[-–to]+/i).map((part) => part.trim());
    if (parts.length >= 2) {
      const open = parts[0];
      const close = parts[1];
      return {
        open,
        close,
        isClosed: false,
        is24Hours: looksLike24Hours(open, close),
      };
    }
    return null;
  }

  if (typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    if (row.closed === true || row.isClosed === true) {
      return { open: '', close: '', isClosed: true, is24Hours: false };
    }
    if (row.is24Hours === true) {
      return { open: '00:00', close: '23:59', isClosed: false, is24Hours: true };
    }
    const open = String(row.open || row.from || row.start || '').trim();
    const close = String(row.close || row.to || row.end || '').trim();
    if (!open && !close) return null;
    if (open && close) {
      return {
        open,
        close,
        isClosed: false,
        is24Hours: looksLike24Hours(open, close),
      };
    }
  }

  return null;
}

function parseTodayWindow(timings: unknown): DaySlot | null {
  if (!timings) return null;

  if (typeof timings === 'string') {
    return normalizeDaySlot(timings);
  }

  const today = WEEKDAYS[new Date().getDay()];
  return normalizeDaySlot(dayEntry(timings, today));
}

function toMinutes(value: string): number | null {
  const cleaned = value.trim().toLowerCase();
  const ampm = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2] || 0);
    const meridiem = ampm[3];
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    return h * 60 + m;
  }
  const hhmm = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const hours = Number(hhmm[1]);
    const minutes = Number(hhmm[2]);
    if (hours === 24 && minutes === 0) return 24 * 60;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }
  return null;
}

function formatTime12h(value: string): string {
  const mins = toMinutes(value);
  if (mins == null) return value.trim();
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h24 % 12 || 12;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function isOpenNow(open: string, close: string, nowMin: number, is24Hours: boolean): boolean {
  if (is24Hours) return true;
  const openMin = toMinutes(open);
  const closeMin = toMinutes(close);
  if (openMin == null || closeMin == null) return false;
  if (closeMin === openMin) return is24Hours || looksLike24Hours(open, close);
  if (closeMin > openMin) {
    return nowMin >= openMin && nowMin <= closeMin;
  }
  return nowMin >= openMin || nowMin < closeMin;
}

export function getBusinessOpenStatus(timings: unknown): OpenStatus {
  const slot = parseTodayWindow(timings);
  if (!slot || slot.isClosed || !slot.open || !slot.close) {
    if (slot?.isClosed) return { status: 'Closed', label: 'Closed' };
    return { status: 'Unknown', label: '' };
  }

  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const open = isOpenNow(slot.open, slot.close, nowMin, slot.is24Hours);

  if (open) {
    return {
      status: 'Open',
      label: slot.is24Hours ? 'Open 24 hours' : `Open till ${formatTime12h(slot.close)}`,
    };
  }

  return { status: 'Closed', label: 'Closed' };
}

export function getTodayHoursFlags(timings: unknown): {
  openNow: boolean;
  openToday: boolean;
  open24Hours: boolean;
  openLate: boolean;
} {
  const slot = parseTodayWindow(timings);
  const openNow = getBusinessOpenStatus(timings).status === 'Open';
  const openToday = Boolean(slot && !slot.isClosed && slot.open && slot.close);
  const open24Hours = Boolean(slot?.is24Hours);
  let openLate = open24Hours;
  if (slot && !slot.isClosed && !open24Hours) {
    const closeMin = toMinutes(slot.close);
    const openMin = toMinutes(slot.open);
    if (closeMin != null && openMin != null) {
      openLate = closeMin <= openMin || closeMin >= 21 * 60;
    }
  }
  return { openNow, openToday, open24Hours, openLate };
}

const WEEKDAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

const WEEKDAYS_MONDAY_FIRST = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

function formatDayHours(entry: unknown): string {
  const slot = normalizeDaySlot(entry);
  if (!slot) return '—';
  if (slot.isClosed) return 'Closed';
  if (slot.is24Hours) return 'Open 24 hours';
  if (slot.open && slot.close) {
    return `${formatTime12h(slot.open)} – ${formatTime12h(slot.close)}`;
  }
  return '—';
}

export type WeekDayHours = {
  day: string;
  hours: string;
  isToday: boolean;
};

export function getWeeklyHours(timings: unknown): WeekDayHours[] {
  if (!timings) return [];
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday=0
  return WEEKDAYS_MONDAY_FIRST.map((day, index) => ({
    day: WEEKDAY_LABELS[index],
    hours: formatDayHours(dayEntry(timings, day)),
    isToday: index === todayIndex,
  })).filter((row) => row.hours !== '—');
}
