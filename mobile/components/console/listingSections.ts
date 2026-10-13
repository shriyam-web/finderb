import type { Ionicons } from '@expo/vector-icons';
import type { ConsoleOverview, Timings } from '../../lib/merchantConsoleApi';

export type SectionKey = 'basics' | 'contact' | 'location' | 'hours' | 'offers' | 'social';

export type ListingSection = {
  key: SectionKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Completion keys from the website's profile checklist that this section fixes. */
  fields: string[];
};

export const LISTING_SECTIONS: ListingSection[] = [
  { key: 'basics', title: 'Name & about', icon: 'storefront-outline', fields: ['displayName', 'about'] },
  { key: 'contact', title: 'Contact & owner', icon: 'call-outline', fields: ['publicPhone', 'whatsappNumber', 'ownerInfo', 'website'] },
  { key: 'location', title: 'Address & map pin', icon: 'location-outline', fields: ['businessAddress', 'city', 'state', 'country', 'mapLocation'] },
  { key: 'hours', title: 'Opening hours', icon: 'time-outline', fields: ['timings'] },
  { key: 'offers', title: 'Payments & offers', icon: 'pricetags-outline', fields: ['paymentModes', 'yearsInBusiness'] },
  { key: 'social', title: 'Social links', icon: 'share-social-outline', fields: ['instagramUrl', 'facebookUrl', 'youtubeUrl'] },
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export const PAYMENT_MODES = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Cheque'];

export const DISCOUNT_OPTIONS = [
  'No Discount',
  '5% - 10% OFF',
  '10% - 20% OFF',
  '20% - 30% OFF',
  '30% - 40% OFF',
  'Up to 50% OFF',
  'Special Festive Discount',
];

function to12h(value: string | undefined): string {
  const [h, m] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
}

export function dayLabel(timings: Timings, day: string): string {
  const slot = timings?.[day];
  if (!slot) return 'Not set';
  if (slot.isClosed) return 'Closed';
  if (slot.is24Hours || (slot.open === '00:00' && slot.close === '23:59')) return 'Open 24 hours';
  if (!slot.open || !slot.close) return 'Not set';
  return `${to12h(slot.open)} – ${to12h(slot.close)}`;
}

export function hoursSummary(timings: Timings): string {
  const set = DAYS.filter((day) => timings?.[day]);
  if (!set.length) return 'Not set yet';
  const labels = DAYS.map((day) => dayLabel(timings, day));
  if (labels.every((label) => label === labels[0])) return `Every day · ${labels[0]}`;
  const weekday = labels.slice(0, 5);
  if (weekday.every((label) => label === weekday[0])) {
    return `Mon–Fri ${weekday[0]} · Sat ${labels[5]} · Sun ${labels[6]}`;
  }
  return `${set.length} days set`;
}

export function sectionSummary(key: SectionKey, o: ConsoleOverview): string {
  const p = o.profile;
  switch (key) {
    case 'basics':
      return [p.displayName || p.businessName, p.about ? `${p.about.split(/\s+/).filter(Boolean).length} words about you` : 'No description yet']
        .filter(Boolean)
        .join(' · ');
    case 'contact':
      return [p.publicPhone ? `+91 ${p.publicPhone}` : 'No public phone', p.ownerName].filter(Boolean).join(' · ');
    case 'location':
      return [p.businessAddress || 'No address', p.latitude && p.longitude ? 'Pinned on map' : 'No map pin'].join(' · ');
    case 'hours':
      return hoursSummary(p.timings);
    case 'offers':
      return [
        p.paymentModes.length ? p.paymentModes.join(', ') : 'No payment modes',
        p.discountRange && p.discountRange !== 'No Discount' ? p.discountRange : '',
      ]
        .filter(Boolean)
        .join(' · ');
    case 'social': {
      const linked = [p.instagramUrl && 'Instagram', p.facebookUrl && 'Facebook', p.youtubeUrl && 'YouTube'].filter(Boolean);
      return linked.length ? linked.join(', ') : 'None linked';
    }
    default:
      return '';
  }
}

export function sectionGaps(section: ListingSection, o: ConsoleOverview): number {
  const missing = new Set(o.completion.missing.map((field) => field.key));
  return section.fields.filter((field) => missing.has(field)).length;
}
