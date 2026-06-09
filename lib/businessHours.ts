const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

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

import { formatTime12h } from '@/lib/formatBusinessHours';

function formatCloseTime(close: string): string {
  return formatTime12h(close);
}

function closedState(message = 'Closed now'): BusinessOpenState {
  return {
    status: 'Closed',
    label: message,
    colorClass: 'text-rose-600',
    dotClass: 'bg-rose-500',
  };
}

function openState(closeTime: string): BusinessOpenState {
  return {
    status: 'Open',
    label: `Open till ${formatCloseTime(closeTime)}`,
    colorClass: 'text-emerald-600',
    dotClass: 'bg-emerald-500',
  };
}

function isOpenNow(open: string, close: string, currentMinutes: number): boolean {
  const openMinutes = parseTimeToMinutes(open);
  const closeMinutes = parseTimeToMinutes(close);
  if (openMinutes === null || closeMinutes === null) return false;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  // Overnight hours (e.g. 22:00 – 02:00)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
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

  const now = new Date();
  const day = WEEKDAYS[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const today = (timings as Record<string, unknown>)[day];

  if (!today) {
    return closedState('Closed today');
  }

  if (typeof today === 'string') {
    if (today === 'Closed' || !today.includes('-')) {
      return closedState('Closed today');
    }
    const [open, close] = today.split('-').map((s) => s.trim());
    return isOpenNow(open, close, currentMinutes)
      ? openState(close)
      : closedState('Closed now');
  }

  if (typeof today === 'object' && today !== null) {
    const slot = today as { open?: string; close?: string; isClosed?: boolean };
    if (slot.isClosed) {
      return closedState('Closed today');
    }
    if (slot.open && slot.close) {
      return isOpenNow(slot.open, slot.close, currentMinutes)
        ? openState(slot.close)
        : closedState('Closed now');
    }
  }

  return closedState('Closed today');
}
