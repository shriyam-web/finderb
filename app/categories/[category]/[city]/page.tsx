import Link from 'next/link';
import type { Metadata } from 'next';
import { getCategories } from '@/app/actions/category';
import { getBusinessesByCategoryAndCity } from '@/app/actions/business';
import CategoryBusinessList from '@/components/category/CategoryBusinessList';
import JsonLd from '@/components/JsonLd';
import RelatedCategoryLinks from '@/components/seo/RelatedCategoryLinks';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import { formatCityFromSlug } from '@/lib/categoryCity';
import { categoryHref } from '@/lib/categoryDisplay';
import {
  buildCategoryCityCollectionJsonLd,
  buildCategoryCityMetadata,
} from '@/lib/categorySeo';
import { MapPin } from 'lucide-react';

type PageProps = {
  params: Promise<{ category: string; city: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug, city: citySlug } = await params;
  const cityName = formatCityFromSlug(citySlug);

  const catResult = await getCategories(false);
  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find((c: { slug?: string }) => c.slug === categorySlug);
  const categoryName =
    currentCategory?.name || categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const bizResult = await getBusinessesByCategoryAndCity(categorySlug, citySlug, {
    page: 1,
    pageSize: 1,
  });
  const total = bizResult.success ? (bizResult.total ?? 0) : 0;

  return buildCategoryCityMetadata(categorySlug, categoryName, citySlug, cityName, total);
}

export default async function CategoryCityPage({ params }: PageProps) {
  const { category: categorySlug, city: citySlug } = await params;
  const cityName = formatCityFromSlug(citySlug);

  const [catResult, bizResult] = await Promise.all([
    getCategories(false),
    getBusinessesByCategoryAndCity(categorySlug, citySlug, {
      page: 1,
      pageSize: CATEGORY_LISTINGS_PAGE_SIZE,
    }),
  ]);

  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find((c: { slug?: string; name?: string }) => c.slug === categorySlug) || {
    name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    slug: categorySlug,
  };

  const initialBusinesses = bizResult.success && bizResult.businesses ? bizResult.businesses : [];
  const total = bizResult.success ? (bizResult.total ?? initialBusinesses.length) : 0;

  const jsonLd = buildCategoryCityCollectionJsonLd(
    categorySlug,
    currentCategory.name,
    citySlug,
    cityName,
    total
  );

  const relatedCategories = allCategories
    .filter((c: { slug?: string }) => c.slug && c.slug !== categorySlug)
    .slice(0, 8)
    .map((c: { name: string; slug?: string }) => ({
      name: c.name,
      href: categoryHref(c.slug, c.name),
    }));

  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-slate-50 pb-12 pt-6 lg:min-h-screen lg:pt-10">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/categories" className="hover:text-primary">
                Categories
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={categoryHref(categorySlug, currentCategory.name)}
                className="hover:text-primary"
              >
                {currentCategory.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-slate-800">{cityName}</li>
          </ol>
        </nav>

        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            <MapPin size={12} />
            {cityName}
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-primary md:text-4xl lg:text-5xl">
            {currentCategory.name} in {cityName}
          </h1>
          <p className="max-w-3xl font-medium text-slate-500">
            {total > 0
              ? `${total} verified ${currentCategory.name.toLowerCase()} listing${total !== 1 ? 's' : ''} in ${cityName}. Compare ratings, contact numbers, and addresses on FinderB.`
              : `Discover ${currentCategory.name.toLowerCase()} services in ${cityName}. New listings are added regularly on FinderB.`}
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {relatedCategories.length > 0 ? (
            <aside className="w-full lg:w-64">
              <RelatedCategoryLinks title="Related categories" links={relatedCategories} />
            </aside>
          ) : null}

          <div className="flex-1">
            <CategoryBusinessList
              categorySlug={categorySlug}
              citySlug={citySlug}
              initialBusinesses={initialBusinesses}
              initialTotal={total}
              pageSize={CATEGORY_LISTINGS_PAGE_SIZE}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
