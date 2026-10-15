import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';

export const COMPETITOR_COMPLETION_SELECT =
  'id, businessName, displayName, category, publicPhone, owner_name, owner_mobile, businessAddress, city, state, country, about, profilePictureUrl, images, timings, yearsInBusiness, website, facebookUrl, instagramUrl, youtubeUrl, whatsappNumber, latitude, longitude, paymentModes, keywords';

export function averageCompletionPercent(rows: Record<string, unknown>[]): number | null {
  if (!rows.length) return null;
  const percents = rows.map(
    (row) =>
      getProfileCompletion({
        ...row,
        ownerName: row.ownerName || row.owner_name,
        ownerMobile: row.ownerMobile || row.owner_mobile,
      }).percentage,
  );
  return Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);
}
