function parseTimeParts(time: string): { hours: number; minutes: number } | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

export function formatTime12h(time: string): string {
  const parts = parseTimeParts(time);
  if (!parts) return time.trim();

  const { hours, minutes } = parts;
  const hour12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export function formatTimingRange12h(timing: unknown): string {
  if (!timing) return 'Closed';

  if (typeof timing === 'string') {
    if (timing === 'Closed' || !timing.includes('-')) return timing === 'Closed' ? 'Closed' : timing;
    const [open, close] = timing.split('-').map((part) => part.trim());
    return `${formatTime12h(open)} – ${formatTime12h(close)}`;
  }

  if (typeof timing === 'object' && timing !== null) {
    const slot = timing as {
      open?: string;
      close?: string;
      isClosed?: boolean;
      is24Hours?: boolean;
    };
    if (slot.isClosed) return 'Closed';
    if (slot.is24Hours) return 'Open 24 hours';
    if (slot.open && slot.close) {
      return `${formatTime12h(slot.open)} – ${formatTime12h(slot.close)}`;
    }
  }

  return 'Closed';
}
