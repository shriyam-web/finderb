export const GROWTH_PRO_OFFER_NAME = "Founder's Launch Wave";
export const GROWTH_PRO_OFFER_TAGLINE = 'Exclusive early-partner pricing for a limited time';
export const EARLY_BIRD_BADGE_LABEL = 'Early Bird Discount Applied';

export const PRICING_PLANS = {
  free: {
    id: 'starter',
    name: 'Starter',
    tagline: 'List your business and get discovered',
    compareLabel: 'Starter',
    cta: 'Start free',
  },
  monthly: {
    id: 'growth',
    name: 'Growth',
    tagline: 'Full power, pay as you grow',
    compareLabel: 'Growth',
    cta: 'Get Growth',
  },
  annual: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Our best rate — built for serious growth',
    compareLabel: 'Pro',
    cta: 'Go Pro',
  },
} as const;

export const GROWTH_PRO_RETAIL_MONTHLY = 2999;
export const GROWTH_PRO_OFFER_MONTHLY = 499;
export const GROWTH_PRO_MONTHLY_DISCOUNT_PERCENT = 83.36;

export const GROWTH_PRO_RETAIL_ANNUAL = GROWTH_PRO_RETAIL_MONTHLY * 12;
export const GROWTH_PRO_OFFER_ANNUAL = 3588;
export const GROWTH_PRO_EFFECTIVE_MONTHLY_ANNUAL = 299;
export const GROWTH_PRO_ANNUAL_DISCOUNT_PERCENT = Number(
  (((GROWTH_PRO_RETAIL_ANNUAL - GROWTH_PRO_OFFER_ANNUAL) / GROWTH_PRO_RETAIL_ANNUAL) * 100).toFixed(1)
);

export const GROWTH_PRO_FEATURES = [
  'Premium business listing with rich profile',
  'Verified partner badge on your profile',
  'Priority placement in local search',
  'Lead center with customer contact details',
  'Advanced analytics & performance insights',
  'Unlimited photo gallery',
  'SMS & email lead notifications',
  'Direct customer chat',
  '24/7 priority merchant support',
] as const;

export const FREE_LISTING_INCLUDED = [
  'Basic business listing & profile',
  'Business name, address & phone',
  'Up to 3 photos on your listing',
  'Standard search visibility',
] as const;

/** Shown on the free plan as unavailable (strikethrough / locked). */
export const FREE_LISTING_LOCKED = [
  'Verified partner badge',
  'Priority placement in local search',
  'Lead center with contact details',
  'Advanced analytics & insights',
  'Unlimited photo gallery',
  'SMS & email lead notifications',
  'Direct customer chat',
  '24/7 priority merchant support',
] as const;

export type CompareRow = {
  label: string;
  free: boolean | string;
  monthly: boolean | string;
  annual: boolean | string;
};

export const PLAN_COMPARE_ROWS: CompareRow[] = [
  { label: 'Business listing', free: true, monthly: true, annual: true },
  { label: 'Photos on listing', free: 'Up to 3', monthly: 'Unlimited', annual: 'Unlimited' },
  { label: 'Search placement', free: 'Standard', monthly: 'Priority', annual: 'Priority' },
  { label: 'Verified partner badge', free: false, monthly: true, annual: true },
  { label: 'Lead center', free: false, monthly: true, annual: true },
  { label: 'Customer contact in leads', free: false, monthly: true, annual: true },
  { label: 'Analytics dashboard', free: false, monthly: true, annual: true },
  { label: 'SMS & email lead alerts', free: false, monthly: true, annual: true },
  { label: 'Direct customer chat', free: false, monthly: true, annual: true },
  { label: 'Priority support', free: false, monthly: true, annual: true },
];

export const GROWTH_PRO_HIGHLIGHTS = [
  {
    title: 'Get discovered first',
    desc: 'Appear above standard listings when customers search your category and city.',
  },
  {
    title: 'Turn views into leads',
    desc: 'Unlock the lead center — receive enquiries with contact details, not just clicks.',
  },
  {
    title: 'Build instant trust',
    desc: 'The verified badge signals credibility and lifts click-through on your listing.',
  },
  {
    title: 'Measure what works',
    desc: 'Track views, enquiries, and growth trends from one clean dashboard.',
  },
] as const;

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
