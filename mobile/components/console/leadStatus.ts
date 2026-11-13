import type { TagTone } from './kit';

export const LEAD_STATUSES = [
  'To be contacted',
  'Asked to connect later',
  'Contacted',
  'Not interested',
  'Wrong lead',
  'Converted',
  'Closed',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PROFILE_LEAD_BADGE = 'Generated on your profile';
export const CATEGORY_LEAD_BADGE = 'Popular in your category';
export const CATEGORY_LEAD_BADGE_LEGACY = 'In your category';
export const DIRECT_LEAD_BADGE = 'Direct Lead';

export const LEAD_STATUS_TONE: Record<string, TagTone> = {
  'To be contacted': 'info',
  'Asked to connect later': 'info',
  Contacted: 'warning',
  'Not interested': 'danger',
  'Wrong lead': 'warning',
  Converted: 'success',
  Closed: 'neutral',
};

export function leadSourceOf(lead: { source?: string | null; status?: string | null }): string | null {
  const source = lead.source || '';
  if (
    source === PROFILE_LEAD_BADGE ||
    source === CATEGORY_LEAD_BADGE ||
    source === CATEGORY_LEAD_BADGE_LEGACY ||
    source === DIRECT_LEAD_BADGE
  ) {
    return source === CATEGORY_LEAD_BADGE_LEGACY ? CATEGORY_LEAD_BADGE : source;
  }
  const status = lead.status || '';
  if (
    status === PROFILE_LEAD_BADGE ||
    status === CATEGORY_LEAD_BADGE ||
    status === CATEGORY_LEAD_BADGE_LEGACY ||
    status === DIRECT_LEAD_BADGE
  ) {
    return status === CATEGORY_LEAD_BADGE_LEGACY ? CATEGORY_LEAD_BADGE : status;
  }
  return null;
}

export function sourceTone(source: string | null): TagTone {
  if (source === DIRECT_LEAD_BADGE) return 'info';
  if (source === PROFILE_LEAD_BADGE) return 'success';
  if (source === CATEGORY_LEAD_BADGE) return 'warning';
  return 'neutral';
}

export function sourceLabel(source: string | null): string | null {
  if (source === DIRECT_LEAD_BADGE) return 'Direct';
  if (source === PROFILE_LEAD_BADGE) return 'On your profile';
  if (source === CATEGORY_LEAD_BADGE) return 'Popular in category';
  return source;
}

export function sourceMeaning(source: string | null): string | null {
  if (source === DIRECT_LEAD_BADGE) {
    return 'This customer reached you directly from your FinderB shop. They tapped Call, WhatsApp, or the enquiry form.';
  }
  if (source === PROFILE_LEAD_BADGE) {
    return 'This customer sent an enquiry while they were on your shop.';
  }
  if (source === CATEGORY_LEAD_BADGE) {
    return 'This customer was looking in your category and area. FinderB sent their enquiry to you along with other matching businesses.';
  }
  return null;
}

export function pipelineOf(status: string | null | undefined): LeadStatus {
  const value = status || '';
  if ((LEAD_STATUSES as readonly string[]).includes(value)) return value as LeadStatus;
  return 'To be contacted';
}

export function isOpenPipeline(status: string | null | undefined) {
  const pipeline = pipelineOf(status);
  return pipeline === 'To be contacted' || pipeline === 'Asked to connect later';
}

/** Indian numbers are stored as 10 digits; WhatsApp and the dialer want the country code. */
export function dialable(phone: string | null | undefined): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  return digits.length >= 8 ? digits : null;
}
