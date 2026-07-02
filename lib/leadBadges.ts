export const PROFILE_LEAD_BADGE = 'Generated on your profile';
export const CATEGORY_LEAD_BADGE = 'In your category';
export const DIRECT_LEAD_BADGE = 'Direct Lead';

export function leadBadgeClassName(status: string): string {
  if (status === DIRECT_LEAD_BADGE) {
    return 'bg-violet-50 text-violet-900 border-violet-200';
  }
  if (status === PROFILE_LEAD_BADGE) {
    return 'bg-[#215481]/10 text-[#153551] border-[#215481]/20';
  }
  if (status === CATEGORY_LEAD_BADGE) {
    return 'bg-[#f9b864]/15 text-[#8a5a12] border-[#f9b864]/35';
  }
  if (status === 'New Lead' || status === 'New') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  }
  if (status === 'Contacted') {
    return 'bg-amber-50 text-amber-800 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}
