import type { Business } from '@/lib/mockData';
import { businessHasPublicPhoto } from '@/lib/businessMapping';
import { getBusinessProfileCompletenessScore } from '@/lib/businessProfileCompleteness';

/** Minimum completeness score required for Google indexing. */
export const MIN_INDEX_QUALITY_SCORE = 40;

export type BusinessIndexRecord = Business & {
  status?: string | null;
  paymentStatus?: string | null;
  slug?: string | null;
};

export type BusinessIndexDecision = {
  index: boolean;
  score: number;
  reason: string;
  tier: 'index' | 'noindex-thin' | 'noindex-inactive' | 'noindex-draft';
};

function hasMeaningfulText(value?: string | null, min = 12): boolean {
  return Boolean(value?.trim() && value.trim().length >= min);
}

export function getBusinessSeoQualityScore(business: BusinessIndexRecord): number {
  return getBusinessProfileCompletenessScore(business);
}

export function getBusinessIndexDecision(business: BusinessIndexRecord): BusinessIndexDecision {
  const score = getBusinessSeoQualityScore(business);
  const status = (business.status || 'Active').toLowerCase();

  if (status !== 'active') {
    return {
      index: false,
      score,
      reason: 'Business status is not Active',
      tier: 'noindex-inactive',
    };
  }

  if (!businessHasPublicPhoto(business)) {
    return {
      index: false,
      score,
      reason: 'Missing photos — listing is hidden from public',
      tier: 'noindex-thin',
    };
  }

  const paymentStatus = (business.paymentStatus || '').toLowerCase();
  if (paymentStatus === 'draft') {
    return {
      index: false,
      score,
      reason: 'Draft business profile',
      tier: 'noindex-draft',
    };
  }

  const hasIdentity =
    hasMeaningfulText(business.name, 2) && hasMeaningfulText(business.category, 2);
  const hasContactOrLocation =
    hasMeaningfulText(business.contact, 8) ||
    hasMeaningfulText(business.businessAddress, 8) ||
    hasMeaningfulText(business.city, 2);
  const hasDescription =
    hasMeaningfulText(business.about, 20) || hasMeaningfulText(business.description, 20);
  const hasVisual = businessHasPublicPhoto(business);
  const hasServices = (business.services?.length ?? 0) > 0;

  if (!hasIdentity || !hasContactOrLocation) {
    return {
      index: false,
      score,
      reason: 'Missing core NAP fields (name, category, phone/address/city)',
      tier: 'noindex-thin',
    };
  }

  if (score < MIN_INDEX_QUALITY_SCORE && !hasDescription && !hasVisual && !hasServices) {
    return {
      index: false,
      score,
      reason: `Profile quality score ${score} is below threshold ${MIN_INDEX_QUALITY_SCORE}`,
      tier: 'noindex-thin',
    };
  }

  return {
    index: true,
    score,
    reason: 'Profile meets FinderB local SEO indexing criteria',
    tier: 'index',
  };
}
