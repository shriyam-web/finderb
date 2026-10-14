export const PROFILE_LEAD_BADGE = 'Generated on your profile';
export const CATEGORY_LEAD_BADGE = 'Popular in your category';
export const CATEGORY_LEAD_BADGE_LEGACY = 'In your category';
export const DIRECT_LEAD_BADGE = 'Direct Lead';

export const LEAD_STATUS_TO_CONTACT = 'To be contacted';
export const LEAD_STATUS_CONTACT_LATER = 'Asked to connect later';
export const LEAD_STATUS_CONTACTED = 'Contacted';
export const LEAD_STATUS_NOT_INTERESTED = 'Not interested';
export const LEAD_STATUS_WRONG = 'Wrong lead';
export const LEAD_STATUS_CONVERTED = 'Converted';
export const LEAD_STATUS_CLOSED = 'Closed';

export const DEFAULT_LEAD_STATUS = LEAD_STATUS_TO_CONTACT;

export const LEAD_PIPELINE_STATUSES = [
  LEAD_STATUS_TO_CONTACT,
  LEAD_STATUS_CONTACT_LATER,
  LEAD_STATUS_CONTACTED,
  LEAD_STATUS_NOT_INTERESTED,
  LEAD_STATUS_WRONG,
  LEAD_STATUS_CONVERTED,
  LEAD_STATUS_CLOSED,
] as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

const SOURCE_LABELS = new Set([
  PROFILE_LEAD_BADGE,
  CATEGORY_LEAD_BADGE,
  CATEGORY_LEAD_BADGE_LEGACY,
  DIRECT_LEAD_BADGE,
]);

const LEGACY_NEW = new Set(['New', 'New Lead']);

export function isLeadSourceBadge(value: string | null | undefined): boolean {
  return Boolean(value && SOURCE_LABELS.has(value));
}

export function normalizeLeadSource(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value === CATEGORY_LEAD_BADGE_LEGACY) return CATEGORY_LEAD_BADGE;
  return isLeadSourceBadge(value) ? value : null;
}

export function leadSourceOf(lead: { source?: string | null; status?: string | null }): string | null {
  return normalizeLeadSource(lead.source) || normalizeLeadSource(lead.status);
}

export function isLeadPipelineStatus(value: string | null | undefined): value is LeadPipelineStatus {
  return Boolean(value && (LEAD_PIPELINE_STATUSES as readonly string[]).includes(value));
}

export function leadPipelineOf(lead: { status?: string | null }): LeadPipelineStatus {
  const status = lead.status || '';
  if (isLeadPipelineStatus(status)) return status;
  if (isLeadSourceBadge(status) || LEGACY_NEW.has(status)) return DEFAULT_LEAD_STATUS;
  return DEFAULT_LEAD_STATUS;
}

export function isOpenLead(lead: { status?: string | null }): boolean {
  const pipeline = leadPipelineOf(lead);
  return pipeline === LEAD_STATUS_TO_CONTACT || pipeline === LEAD_STATUS_CONTACT_LATER;
}

export function isDirectLeadSource(lead: { source?: string | null; status?: string | null }): boolean {
  return leadSourceOf(lead) === DIRECT_LEAD_BADGE;
}

export type LeadSourceKind = 'profile' | 'direct' | 'category';

export function leadSourceKind(source: string | null | undefined): LeadSourceKind | null {
  const normalized = normalizeLeadSource(source);
  if (normalized === PROFILE_LEAD_BADGE) return 'profile';
  if (normalized === DIRECT_LEAD_BADGE) return 'direct';
  if (normalized === CATEGORY_LEAD_BADGE) return 'category';
  return null;
}

/** Distinct professional chips — used on website lead cards. */
export function leadSourceBadgeClassName(source: string | null | undefined): string {
  const kind = leadSourceKind(source);
  if (kind === 'direct') {
    return 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-sm shadow-violet-200/70';
  }
  if (kind === 'profile') {
    return 'bg-[#12324c] text-[#e8f3ff] border-[#0b2236] shadow-sm';
  }
  if (kind === 'category') {
    return 'bg-gradient-to-r from-[#fff4d2] via-[#f7c948] to-[#e8a317] text-[#5a3b04] border-[#d7a21a]/70 shadow-sm shadow-amber-100';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function leadPipelineClassName(status: string | null | undefined): string {
  switch (leadPipelineOf({ status })) {
    case LEAD_STATUS_TO_CONTACT:
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case LEAD_STATUS_CONTACT_LATER:
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case LEAD_STATUS_CONTACTED:
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case LEAD_STATUS_NOT_INTERESTED:
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case LEAD_STATUS_WRONG:
      return 'bg-orange-50 text-orange-900 border-orange-200';
    case LEAD_STATUS_CONVERTED:
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case LEAD_STATUS_CLOSED:
      return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

/** @deprecated use leadSourceBadgeClassName / leadPipelineClassName */
export function leadBadgeClassName(status: string): string {
  if (isLeadSourceBadge(status)) return leadSourceBadgeClassName(status);
  return leadPipelineClassName(status);
}
