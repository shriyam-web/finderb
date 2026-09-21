import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import BusinessListingInactivePage from '@/components/business/BusinessListingInactivePage';
import BusinessProfilePage from '@/components/business/BusinessProfilePage';
import BusinessInternalLinks from '@/components/business/BusinessInternalLinks';
import BusinessSeoContent from '@/components/business/BusinessSeoContent';
import JsonLd from '@/components/JsonLd';
import { buildBusinessJsonLd, buildBusinessMetadata } from '@/lib/businessSeo';
import { buildPageMetadata, NO_INDEX_ROBOTS } from '@/lib/seoUtils';
import { categoryHref } from '@/lib/categoryDisplay';
import {
  getBusinessProfilePath,
  resolveBusinessSlug,
  shouldRedirectToCanonicalBusinessSlug,
} from '@/lib/businessSlug';
import {
  getCachedCategoryBreadcrumb,
  getCachedPublicBusiness,
  getCachedRelatedBusinesses,
  getCachedTopCategoriesForLinks,
} from '@/lib/businessPublicPageData';

/** Public profiles: ISR ~10 min. Updates call revalidateBusinessProfilePaths. */
export const revalidate = 600;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getCachedPublicBusiness(id);

  if (result.reason === 'inactive' && result.listing) {
    const name = result.listing.displayName || result.listing.businessName;
    return buildPageMetadata({
      title: `${name} — listing not public yet`,
      description: `${name} is under review on FinderB and will go live after activation.`,
      canonicalPath: result.listing.slug
        ? `/business/${result.listing.slug}`
        : `/business/${id}`,
      robots: NO_INDEX_ROBOTS,
    });
  }

  return buildBusinessMetadata(result.success && result.business ? result.business : null);
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id: slugOrId } = await params;
  const result = await getCachedPublicBusiness(slugOrId);

  if (result.reason === 'inactive' && result.listing) {
    return <BusinessListingInactivePage listing={result.listing} />;
  }

  const business = result.success && result.business ? result.business : null;

  if (!business) {
    notFound();
  }

  if (shouldRedirectToCanonicalBusinessSlug(slugOrId, business)) {
    permanentRedirect(getBusinessProfilePath(business));
  }

  const canonicalSlug = resolveBusinessSlug(business);

  const categoryResult = business.category
    ? await getCachedCategoryBreadcrumb(business.category)
    : null;
  const categorySlug = categoryResult?.success ? categoryResult.category?.slug : null;
  const jsonLd = buildBusinessJsonLd(business, categorySlug);

  const relatedResult = await getCachedRelatedBusinesses(business);
  const topCategories = await getCachedTopCategoriesForLinks();

  const relatedCategories = topCategories
    .filter((cat) => cat.name !== business.category)
    .slice(0, 6)
    .map((cat) => ({
      name: cat.name,
      href: categoryHref(cat.slug, cat.name),
    }));

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <BusinessProfilePage
        slugOrId={canonicalSlug}
        initialBusiness={business}
        initialCategoryBreadcrumb={categoryResult?.success ? categoryResult.category : null}
        initialRelatedCategory={relatedResult?.success ? relatedResult.sameCategory : []}
        initialRelatedCity={relatedResult?.success ? relatedResult.sameCity : []}
      />
      <BusinessSeoContent business={business} />
      <BusinessInternalLinks
        business={business}
        categorySlug={categorySlug}
        relatedCategories={relatedCategories}
        sameCategoryBusinesses={relatedResult?.success ? relatedResult.sameCategory : []}
        sameCityBusinesses={relatedResult?.success ? relatedResult.sameCity : []}
      />
    </>
  );
}
