import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import BusinessListingInactivePage from '@/components/business/BusinessListingInactivePage';
import BusinessReviewsList from '@/components/business/BusinessReviewsList';
import { parseBusinessReviewReply, serializePublicReviewsForClient } from '@/lib/businessReviews';
import {
  getBusinessProfilePath,
  resolveBusinessSlug,
  shouldRedirectToCanonicalBusinessSlug,
} from '@/lib/businessSlug';
import { getCachedPublicBusiness } from '@/lib/businessPublicPageData';
import { buildPageMetadata } from '@/lib/seoUtils';

export const revalidate = 600;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCachedPublicBusiness(id);
  const business = result.success && result.business ? result.business : null;
  const name = business?.name || business?.businessName || 'Business';
  const path = business ? `${getBusinessProfilePath(business)}/reviews` : `/business/${id}/reviews`;
  return buildPageMetadata({
    title: `${name} reviews`,
    description: `Recent reviews for ${name} on FinderB.`,
    canonicalPath: path,
  });
}

export default async function BusinessReviewsPage({ params }: PageProps) {
  const { id: slugOrId } = await params;
  const result = await getCachedPublicBusiness(slugOrId);

  if (result.reason === 'inactive' && result.listing) {
    return <BusinessListingInactivePage listing={result.listing} />;
  }

  const business = result.success && result.business ? result.business : null;
  if (!business) notFound();

  if (shouldRedirectToCanonicalBusinessSlug(slugOrId, business)) {
    permanentRedirect(`${getBusinessProfilePath(business)}/reviews`);
  }

  const reply = parseBusinessReviewReply(business.reviewReply);

  return (
    <BusinessReviewsList
      reviews={serializePublicReviewsForClient(business.review)}
      businessId={business.id}
      businessName={business.name || 'this business'}
      profilePath={`/business/${resolveBusinessSlug(business)}`}
      defaultReply={reply?.content}
    />
  );
}
