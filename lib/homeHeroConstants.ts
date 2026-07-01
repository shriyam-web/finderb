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

export const POPULAR_SEARCHES = [
  { term: 'Real Estate', icon: Building2, iconColor: 'text-blue-600' },
  { term: 'B2B', icon: Handshake, iconColor: 'text-indigo-600' },
  { term: 'Admissions', icon: GraduationCap, iconColor: 'text-emerald-600' },
  { term: 'FinderB News', icon: Newspaper, iconColor: 'text-sky-600' },
  { term: 'CA', icon: Briefcase, iconColor: 'text-blue-600' },
  { term: 'Dentist', icon: Stethoscope, iconColor: 'text-emerald-600' },
  { term: 'Restaurant', icon: UtensilsCrossed, iconColor: 'text-orange-500' },
  { term: 'Gym', icon: Dumbbell, iconColor: 'text-violet-600' },
  { term: 'Salon', icon: Scissors, iconColor: 'text-pink-500' },
  { term: 'PG', icon: Home, iconColor: 'text-slate-600' },
  { term: 'Lawyer', icon: Scale, iconColor: 'text-slate-600' },
  { term: 'Car Service', icon: Car, iconColor: 'text-slate-600' },
  { term: 'Makeup Artist', icon: Sparkles, iconColor: 'text-slate-600' },
] as const;

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
