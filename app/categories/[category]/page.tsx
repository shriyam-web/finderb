import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories } from '@/app/actions/category';
import { getBusinessesByCategory } from '@/app/actions/business';
import CategoriesPageClient from '@/components/categories/CategoriesPageClient';
import CategoriesBrowseFallback from '@/components/categories/CategoriesBrowseFallback';
import JsonLd from '@/components/JsonLd';
import RelatedCategoryLinks from '@/components/seo/RelatedCategoryLinks';
import {
  buildCategoryCollectionJsonLd,
  buildCategorySlugMetadata,
} from '@/lib/categorySeo';
import { categoryHref } from '@/lib/categoryDisplay';

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sub?: string; id?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categorySlug = (await params).category;
  const catResult = await getCategories(false);
  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find((c: { slug?: string }) => c.slug === categorySlug);

  const name =
    currentCategory?.name ||
    (categorySlug === 'all' ? 'All Services' : categorySlug.replace(/-/g, ' '));

  const bizResult = await getBusinessesByCategory(categorySlug, {
    page: 1,
    pageSize: 1,
  });
  const total = bizResult.success ? (bizResult.total ?? 0) : 0;

  return buildCategorySlugMetadata(categorySlug, name, total);
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const categorySlug = (await params).category;
  const { sub: initialSubSlug = null } = await searchParams;

  const [catResult, bizResult] = await Promise.all([
    getCategories(false),
    getBusinessesByCategory(categorySlug, {
      page: 1,
      pageSize: 1,
    }),
  ]);

  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find(
    (c: { slug?: string; name?: string }) => c.slug === categorySlug
  ) || {
    name: categorySlug === 'all' ? 'All Services' : categorySlug.replace(/-/g, ' '),
    slug: categorySlug,
  };

  const total = bizResult.success ? (bizResult.total ?? 0) : 0;
  const jsonLd = buildCategoryCollectionJsonLd(
    currentCategory.slug || categorySlug,
    currentCategory.name,
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
    <>
      <JsonLd data={jsonLd} />
      {/* Crawlable SSR summary — interactive UI is the modern Categories shell. */}
      <div className="sr-only">
        <h1>{currentCategory.name}</h1>
        <p>
          {total > 0
            ? `${total} business${total !== 1 ? 'es' : ''} in this category on FinderB.`
            : `${currentCategory.name} businesses and services on FinderB.`}
        </p>
        {relatedCategories.length > 0 ? (
          <RelatedCategoryLinks title="Related categories" links={relatedCategories} />
        ) : null}
      </div>
      <Suspense fallback={<CategoriesBrowseFallback />}>
        <CategoriesPageClient
          initialCategorySlug={categorySlug}
          initialSubSlug={initialSubSlug}
          initialCategories={allCategories}
        />
      </Suspense>
    </>
  );
}
