export const REVIEW_STAR_EMOJI: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '😠', label: 'Angry' },
  2: { emoji: '😢', label: 'Sad' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '😊', label: 'Happy' },
  5: { emoji: '😍', label: 'Love' },
};

export function buildReviewInvitePath(slugOrId: string): string {
  return `/review/${encodeURIComponent(slugOrId)}`;
}

export function buildReviewInviteUrl(slugOrId: string, site = 'https://finderb.com'): string {
  return `${site}${buildReviewInvitePath(slugOrId)}`;
}

export { reviewTemplatesForCategory } from './reviewSuggestions';
