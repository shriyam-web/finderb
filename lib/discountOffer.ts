const OFFER_COPY: Record<string, { headline: string; detail: (name: string) => string }> = {
  '5% - 10% OFF': {
    headline: '5%–10% off',
    detail: () => 'On select services. Ask what’s included when you enquire.',
  },
  '10% - 20% OFF': {
    headline: '10%–20% off',
    detail: () => 'On select services. Ask what’s included when you enquire.',
  },
  '20% - 30% OFF': {
    headline: '20%–30% off',
    detail: () => 'On select services. Ask what’s included when you enquire.',
  },
  '30% - 40% OFF': {
    headline: '30%–40% off',
    detail: () => 'On select services. Ask what’s included when you enquire.',
  },
  'Up to 50% OFF': {
    headline: 'Up to 50% off',
    detail: () => 'On select services. Ask what’s included when you enquire.',
  },
  'Special Festive Discount': {
    headline: 'Festive discount',
    detail: (name) => `Festive pricing is on. Call ${name} to know what’s covered.`,
  },
  'Seasonal Offer': {
    headline: 'Seasonal offer',
    detail: (name) => `A seasonal deal is running. Call or message ${name} for what’s on offer.`,
  },
};

export function getDiscountOfferDisplay(
  discountRange: string | null | undefined,
  businessName = 'this business'
): { headline: string; detail: string; label: string } | null {
  const label = discountRange?.trim();
  if (!label || label === 'No Discount') return null;

  const copy = OFFER_COPY[label];
  if (copy) {
    return {
      label,
      headline: copy.headline,
      detail: copy.detail(businessName),
    };
  }

  return {
    label,
    headline: label,
    detail: `Mention this listing when you contact ${businessName}.`,
  };
}

/** Short badge label — exact % range when available (e.g. `5% - 10% OFF`). */
export function getDiscountOfferBadgeLabel(
  discountRange: string | null | undefined
): string | null {
  const label = discountRange?.trim();
  if (!label || label === 'No Discount') return null;
  if (label.includes('%')) return label;
  if (label === 'Special Festive Discount') return 'Festive Discount';
  return label;
}

/** Compact label for narrow listing cards. */
export function getDiscountOfferCardLabel(
  discountRange: string | null | undefined
): string | null {
  const label = getDiscountOfferBadgeLabel(discountRange);
  if (!label) return null;
  if (label.includes('%')) {
    return label
      .replace(/\s*-\s*/g, '–')
      .replace(/\s*OFF$/i, ' off');
  }
  if (label === 'Seasonal Offer') return 'Seasonal deal';
  if (label === 'Festive Discount') return 'Festive deal';
  return label;
}

export type DiscountVisibilityTier = 'none' | 'light' | 'medium' | 'high';

export function getDiscountVisibilityImpact(discountRange: string | null | undefined): {
  tier: DiscountVisibilityTier;
  title: string;
  message: string;
} {
  const label = discountRange?.trim() || 'No Discount';

  if (!label || label === 'No Discount') {
    return {
      tier: 'none',
      title: 'Standard visibility',
      message:
        'Without an active offer, your listing won’t show a discount badge. Merchants with visible deals tend to get more clicks in search and category results.',
    };
  }

  if (label === '5% - 10% OFF') {
    return {
      tier: 'light',
      title: 'Offer badge on your listing',
      message:
        'A discount badge appears on your profile. Even a modest offer can help you stand out next to listings with no deal.',
    };
  }

  if (label === '10% - 20% OFF' || label === 'Seasonal Offer') {
    return {
      tier: 'medium',
      title: 'Better discoverability',
      message:
        'Mid-range offers are highlighted to customers browsing for deals and add to your profile strength score.',
    };
  }

  return {
    tier: 'high',
    title: 'Maximum offer visibility',
    message:
      'Stronger discounts are prioritised in offer-led discovery and attract more enquiries from customers actively looking for savings.',
  };
}
