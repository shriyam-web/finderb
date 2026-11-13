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
  if (kind.includes('ownership')) {
    return {
      url: '/business/dashboard?alert=ownership',
      label: 'Review request',
    };
  }
  if (kind.includes('lead')) {
    return {
      url: '/business/dashboard?tab=leads',
      label: 'Open leads',
    };
  }
  if (kind.includes('ad_approved') || kind.includes('ad-approved')) {
    const orderId = typeof metadata?.orderId === 'string' ? metadata.orderId.trim() : '';
    return {
      url: orderId
        ? `/business/promote?order=${encodeURIComponent(orderId)}`
        : '/business/promotions',
      label: 'Pay for this ad',
    };
  }
  return {
    url: '/business/dashboard',
    label: 'Open dashboard',
  };
}
