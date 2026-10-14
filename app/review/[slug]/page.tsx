import { notFound } from 'next/navigation';
import { getCachedPublicBusiness } from '@/lib/businessPublicPageData';
import ReviewInviteClient from '@/components/reviews/ReviewInviteClient';

export const revalidate = 300;

export default async function ReviewInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getCachedPublicBusiness(decodeURIComponent(slug));
  const business = result.success && result.business ? result.business : null;
  if (!business) notFound();

  const profilePath = business.slug ? `/business/${business.slug}` : `/business/${business.id}`;
  return (
    <ReviewInviteClient
      businessId={business.id}
      businessName={business.name || business.businessName || 'this business'}
      category={business.category || ''}
      city={business.city || ''}
      profilePath={profilePath}
      reviewPath={`/review/${encodeURIComponent(slug)}`}
    />
  );
}
