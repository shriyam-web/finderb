import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Stethoscope,
  UtensilsCrossed,
  Dumbbell,
  Home,
  Scale,
  Car,
  Sparkles,
  ShieldCheck,
  MapPin,
  Zap,
  Building2,
  Handshake,
  GraduationCap,
  Newspaper,
  Scissors,
  UserRound,
} from 'lucide-react';

export const HERO_SEARCH_TYPEWRITER_EXAMPLES = [
  'dentist near me',
  'CA firm near me',
  'gym near me',
  'salon near me',
  'plumber near me',
  'restaurant near me',
  'lawyer near me',
  'electrician near me',
  'wedding photographer near me',
  'real estate agent near me',
  'interior designer near me',
  'packers and movers near me',
  'coaching classes near me',
  'hospitals near me',
  'car service near me',
  'café near me',
  'makeup artist near me',
  'PG accommodation near me',
  'pathology lab near me',
  'pest control near me',
] as const;

export type PopularSearchItem = {
  term: string;
  icon: LucideIcon;
  iconColor: string;
  href?: string;
};

/** Always-visible first four hero chips (pages / core verticals). */
export const HERO_PINNED_SEARCHES: PopularSearchItem[] = [
  {
    term: 'Real Estate',
    icon: Building2,
    iconColor: 'text-blue-600',
    href: '/categories/real-estate',
  },
  {
    term: 'B2B',
    icon: Handshake,
    iconColor: 'text-indigo-600',
    href: '/categories/b2b',
  },
  {
    term: 'Education',
    icon: GraduationCap,
    iconColor: 'text-emerald-600',
    href: '/categories/education',
  },
  {
    term: 'FinderB News',
    icon: Newspaper,
    iconColor: 'text-sky-600',
    href: '/news',
  },
];

/**
 * Extra popular chips — only shown when a matching Active top-level category exists.
 * `matchSlugs` is tried in order against live category slugs.
 */
export const HERO_CATEGORY_CHIP_DEFS: Array<{
  term: string;
  icon: LucideIcon;
  iconColor: string;
  matchSlugs: string[];
}> = [
  {
    term: 'CA',
    icon: Briefcase,
    iconColor: 'text-blue-600',
    matchSlugs: ['ca', 'chartered-accountants'],
  },
  {
    term: 'Doctor',
    icon: UserRound,
    iconColor: 'text-rose-600',
    matchSlugs: ['doctors', 'hospitals'],
  },
  {
    term: 'Dentist',
    icon: Stethoscope,
    iconColor: 'text-emerald-600',
    matchSlugs: ['dentists'],
  },
  {
    term: 'Restaurant',
    icon: UtensilsCrossed,
    iconColor: 'text-orange-500',
    matchSlugs: ['restaurants'],
  },
  {
    term: 'Gym',
    icon: Dumbbell,
    iconColor: 'text-violet-600',
    matchSlugs: ['gym'],
  },
  {
    term: 'Salon',
    icon: Scissors,
    iconColor: 'text-pink-500',
    matchSlugs: ['beauty-spa', 'unisex-salons'],
  },
  {
    term: 'PG',
    icon: Home,
    iconColor: 'text-slate-600',
    matchSlugs: ['pg-hostels'],
  },
  {
    term: 'Lawyer',
    icon: Scale,
    iconColor: 'text-slate-600',
    matchSlugs: ['lawyers'],
  },
  {
    term: 'Car Service',
    icon: Car,
    iconColor: 'text-slate-600',
    matchSlugs: ['car-repair-services'],
  },
  {
    term: 'Makeup Artist',
    icon: Sparkles,
    iconColor: 'text-slate-600',
    matchSlugs: ['makeup-artists', 'bridal-makeup', 'beauty-spa'],
  },
];

/** @deprecated Prefer buildHeroPopularSearches() with live categories. */
export const POPULAR_SEARCHES: PopularSearchItem[] = [
  ...HERO_PINNED_SEARCHES,
  ...HERO_CATEGORY_CHIP_DEFS.map((chip) => ({
    term: chip.term,
    icon: chip.icon,
    iconColor: chip.iconColor,
    href: `/categories/${chip.matchSlugs[0]}`,
  })),
];

export function buildHeroPopularSearches(
  categories: Array<{ slug?: string | null; name?: string | null }>
): PopularSearchItem[] {
  const bySlug = new Map<string, { slug: string; name?: string | null }>();
  for (const cat of categories) {
    const slug = cat.slug?.trim();
    if (!slug) continue;
    bySlug.set(slug, { slug, name: cat.name });
  }

  const dynamic: PopularSearchItem[] = [];
  for (const chip of HERO_CATEGORY_CHIP_DEFS) {
    const match = chip.matchSlugs.map((s) => bySlug.get(s)).find(Boolean);
    if (!match) continue;
    dynamic.push({
      term: chip.term,
      icon: chip.icon,
      iconColor: chip.iconColor,
      href: `/categories/${match.slug}`,
    });
  }

  return [...HERO_PINNED_SEARCHES, ...dynamic];
}

export {
  HERO_CITIES_BY_STATE,
  HERO_POPULAR_CITIES,
  isHeroCitySelected,
  filterCitiesByState,
  sortStatesByPopularity,
} from '@/lib/indianCities';
export type { CitiesByState } from '@/lib/indianCities';

export const HERO_TRUST_BADGES = [
  {
    title: 'Trusted',
    subtitle: 'Verified Listings',
    icon: ShieldCheck,
    badgeBg: 'bg-blue-50',
    iconWrap: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Local',
    subtitle: 'Near You',
    icon: MapPin,
    badgeBg: 'bg-emerald-50',
    iconWrap: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Fast',
    subtitle: 'Quick Results',
    icon: Zap,
    badgeBg: 'bg-amber-50',
    iconWrap: 'bg-amber-100',
    iconColor: 'text-amber-500',
  },
] as const;
