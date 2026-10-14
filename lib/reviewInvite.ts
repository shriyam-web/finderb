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

export function reviewTemplatesForCategory(category: string): string[] {
  const key = category.trim().toLowerCase();
  const common = [
    'Quick service and the team was polite throughout.',
    'Fair prices and they explained everything clearly.',
    'I would recommend them to family and friends.',
  ];

  if (/restaur|food|cafe|sweet|bakery|dhaba/.test(key)) {
    return [
      'Food was fresh and tasted just like we hoped.',
      'Staff seated us quickly and checked back at the right time.',
      'Clean place, generous portions, and worth the money.',
      ...common,
    ];
  }
  if (/salon|spa|beauty|groom/.test(key)) {
    return [
      'They listened to what I wanted and the finish looked great.',
      'Hygienic station and a calm, professional experience.',
      'Booking was easy and they started on time.',
      ...common,
    ];
  }
  if (/clinic|hospital|dentist|doctor|pharma/.test(key)) {
    return [
      'The doctor listened carefully and explained the next steps.',
      'Waiting time was reasonable and the staff were kind.',
      'Clinic was clean and I felt looked after.',
      ...common,
    ];
  }
  if (/school|tutor|coach|educat/.test(key)) {
    return [
      'Teachers were patient and the progress was easy to see.',
      'Clear communication with parents and a disciplined class.',
      'Good value for the attention my child received.',
      ...common,
    ];
  }
  if (/real estate|property|interior|construct|architect/.test(key)) {
    return [
      'They showed options that matched our budget without pressure.',
      'Site visit was organised and paperwork was explained well.',
      'Honest about timelines and hidden costs.',
      ...common,
    ];
  }
  if (/auto|garage|car|bike|mechanic/.test(key)) {
    return [
      'Diagnosed the issue fast and did not push extra work.',
      'Fair quote and the vehicle was ready when promised.',
      'Workshop was organised and they showed the replaced parts.',
      ...common,
    ];
  }
  if (/electri|plumb|ac |hvac|repair|service/.test(key)) {
    return [
      'Reached on time and finished the job neatly.',
      'Explained the fault and charged only for what was needed.',
      'Cleaned up after the work and tested everything.',
      ...common,
    ];
  }

  return [
    'They understood what I needed and delivered without fuss.',
    'Professional from the first call to the last update.',
    'Quality work and I will come back again.',
    ...common,
  ];
}
