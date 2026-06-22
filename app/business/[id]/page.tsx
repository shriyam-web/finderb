import { cache } from 'react';
import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
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
import { shouldRedirectLegacyBusinessUrl } from '@/lib/businessSlug';

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

  if (business && shouldRedirectLegacyBusinessUrl(slugOrId, business.slug)) {
    permanentRedirect(`/business/${business.slug}`);
  }

  const categoryResult =
    business?.category ? await findCategoryForBreadcrumb(business.category) : null;
  const categorySlug = categoryResult?.success ? categoryResult.category?.slug : null;
  const jsonLd = business ? buildBusinessJsonLd(business, categorySlug) : null;

  const relatedResult = business
    ? await getRelatedBusinessesForProfile(business)
    : null;

  const categoriesResult = await getCategories(true);
  const relatedCategories = (categoriesResult.success && categoriesResult.categories
    ? categoriesResult.categories
    : []
  )
    .filter((cat: { name?: string }) => cat.name !== business?.category)
    .slice(0, 6)
    .map((cat: { name: string; slug?: string }) => ({
      name: cat.name,
      href: categoryHref(cat.slug, cat.name),
    }));

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <BusinessProfilePage
        slugOrId={slugOrId}
        initialBusiness={business}
        initialCategoryBreadcrumb={categoryResult?.success ? categoryResult.category : null}
        initialRelatedCategory={relatedResult?.success ? relatedResult.sameCategory : []}
        initialRelatedCity={relatedResult?.success ? relatedResult.sameCity : []}
      />
      {business ? (
        <>
          <BusinessSeoContent business={business} />
          <BusinessInternalLinks
            business={business}
            categorySlug={categorySlug}
            relatedCategories={relatedCategories}
            sameCategoryBusinesses={
              relatedResult?.success ? relatedResult.sameCategory : []
            }
            sameCityBusinesses={relatedResult?.success ? relatedResult.sameCity : []}
          />
        </>
      ) : null}
    </>
  );
}
