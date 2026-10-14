export type MerchantNotificationCta = {
  url: string;
  label: string;
};

export function merchantNotificationCta(
  type: string,
  metadata?: Record<string, unknown> | null,
): MerchantNotificationCta {
  const kind = (type || '').toLowerCase();
  const reviewId =
    typeof metadata?.reviewId === 'string' ? metadata.reviewId.trim() : '';

  if (kind.includes('review')) {
    return {
      url: reviewId
        ? `/business/dashboard?tab=reviews&reviewId=${encodeURIComponent(reviewId)}`
        : '/business/dashboard?tab=reviews',
      label: 'View review',
    };
  }
  if (kind.includes('lead')) {
    return {
      url: '/business/dashboard?tab=leads',
      label: 'Open leads',
    };
  }
  return {
    url: '/business/dashboard',
    label: 'Open dashboard',
  };
}
