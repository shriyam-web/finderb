export const PROFILE_LEAD_BADGE = 'Generated on your profile';
export const CATEGORY_LEAD_BADGE = 'In your category';

export function leadBadgeClassName(status: string): string {
  if (status === PROFILE_LEAD_BADGE) {
    return 'bg-blue-50 text-blue-800 border-blue-200';
  }
  if (status === CATEGORY_LEAD_BADGE) {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }
  if (status === 'New Lead' || status === 'New') {
    return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  }
  if (status === 'Contacted') {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-100';
}
