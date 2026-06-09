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
