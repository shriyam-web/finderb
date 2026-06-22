import type { BusinessReview } from '@/lib/businessReviews';

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type OpeningHoursSpec = {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string | string[];
  opens: string;
  closes: string;
};

function normalizeTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseTimingSlot(timing: unknown): { opens: string; closes: string } | null {
  if (!timing || timing === 'Closed') return null;

  if (typeof timing === 'string' && timing.includes('-')) {
    const [open, close] = timing.split('-').map((part) => part.trim());
    const opens = normalizeTime(open);
    const closes = normalizeTime(close);
    if (opens && closes) return { opens, closes };
    return null;
  }

  if (typeof timing === 'object' && timing !== null) {
    const slot = timing as { open?: string; close?: string; isClosed?: boolean };
    if (slot.isClosed) return null;
    const opens = slot.open ? normalizeTime(slot.open) : null;
    const closes = slot.close ? normalizeTime(slot.close) : null;
    if (opens && closes) return { opens, closes };
  }

  return null;
}

/** Convert business timings object to schema.org OpeningHoursSpecification[]. */
export function timingsToOpeningHoursSchema(timings: unknown): OpeningHoursSpec[] {
  if (!timings || typeof timings !== 'object') return [];

  const specs: OpeningHoursSpec[] = [];

  for (const day of DAY_ORDER) {
    const slot = parseTimingSlot((timings as Record<string, unknown>)[day]);
    if (!slot) continue;
    specs.push({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${day}`,
      opens: slot.opens,
      closes: slot.closes,
    });
  }

  return specs;
}

export function reviewsToSchemaReviews(reviews: BusinessReview[]) {
  return reviews.slice(0, 10).map((review) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: review.author || 'Customer',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.content,
    ...(review.date ? { datePublished: review.date } : {}),
  }));
}
