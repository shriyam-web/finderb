import { SITE_URL } from '@/lib/businessSeo';
import { getBusinessProfilePath } from '@/lib/businessSlug';

export function buildReviewInvitePath(business: {
  id: string;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
}): string {
  const profile = getBusinessProfilePath(business);
  const slug = profile.replace(/^\/business\//, '');
  return `/review/${encodeURIComponent(slug || business.id)}`;
}

export function buildReviewInviteUrl(business: {
  id: string;
  slug?: string | null;
  name?: string | null;
  businessName?: string | null;
  displayName?: string | null;
  city?: string | null;
}): string {
  return `${SITE_URL}${buildReviewInvitePath(business)}`;
}

export const REVIEW_STAR_EMOJI: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😠', label: 'Angry' },
  2: { emoji: '😢', label: 'Sad' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '😊', label: 'Happy' },
  5: { emoji: '😍', label: 'Love' },
};

export { reviewTemplatesForCategory } from '@/lib/reviewSuggestions';
