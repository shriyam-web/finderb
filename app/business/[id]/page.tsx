import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  getBusinessBySlugOrId,
  getRelatedBusinessesForProfile,
} from '@/app/actions/business';
import { findCategoryForBreadcrumb, getCategories } from '@/app/actions/category';
import BusinessProfilePage from '@/components/business/BusinessProfilePage';
import BusinessInternalLinks from '@/components/business/BusinessInternalLinks';
import BusinessSeoContent from '@/components/business/BusinessSeoContent';
import JsonLd from '@/components/JsonLd';
import { buildBusinessJsonLd, buildBusinessMetadata } from '@/lib/businessSeo';
import { categoryHref } from '@/lib/categoryDisplay';
import {
  getBusinessProfilePath,
  resolveBusinessSlug,
  shouldRedirectToCanonicalBusinessSlug,
} from '@/lib/businessSlug';

type PageProps = {
  params: Promise<{ id: string }>;
};

const getBusinessCached = cache((slugOrId: string) => getBusinessBySlugOrId(slugOrId));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getBusinessCached(id);
  return buildBusinessMetadata(result.success && result.business ? result.business : null);
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id: slugOrId } = await params;
  const result = await getBusinessCached(slugOrId);
  const business = result.success && result.business ? result.business : null;

  if (!business) {
    notFound();
  }

  if (shouldRedirectToCanonicalBusinessSlug(slugOrId, business)) {
    permanentRedirect(getBusinessProfilePath(business));
  }

  const canonicalSlug = resolveBusinessSlug(business);

  const categoryResult = business.category
    ? await findCategoryForBreadcrumb(business.category)
    : null;
  const categorySlug = categoryResult?.success ? categoryResult.category?.slug : null;
  const jsonLd = buildBusinessJsonLd(business, categorySlug);

  const relatedResult = await getRelatedBusinessesForProfile(business);

  const categoriesResult = await getCategories(true);
  const relatedCategories = (categoriesResult.success && categoriesResult.categories
    ? categoriesResult.categories
    : []
  )
    .filter((cat: { name?: string }) => cat.name !== business.category)
    .slice(0, 6)
    .map((cat: { name: string; slug?: string }) => ({
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
