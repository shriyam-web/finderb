import type { TagTone } from './kit';

export const LEAD_STATUSES = ['New', 'Contacted', 'Converted', 'Closed'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_TONE: Record<string, TagTone> = {
  New: 'info',
  Contacted: 'warning',
  Converted: 'success',
  Closed: 'neutral',
};

/** Indian numbers are stored as 10 digits; WhatsApp and the dialer want the country code. */
export function dialable(phone: string | null | undefined): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits.length >= 8 ? digits : null;
}
