import type { Metadata } from 'next';
import { getCategories } from '@/app/actions/category';
import { getBusinessesByCategory } from '@/app/actions/business';
import CategoryBusinessList from '@/components/category/CategoryBusinessList';
import JsonLd from '@/components/JsonLd';
import RelatedCategoryLinks from '@/components/seo/RelatedCategoryLinks';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';
import {
  buildCategoryCollectionJsonLd,
  buildCategorySlugMetadata,
} from '@/lib/categorySeo';
import { categoryHref } from '@/lib/categoryDisplay';
import { Filter, Star, MapPin } from 'lucide-react';

type PageProps = {
  params: Promise<{ category: string }>;
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

export default async function CategoryPage({ params }: PageProps) {
  const categorySlug = (await params).category;

  const [catResult, bizResult] = await Promise.all([
    getCategories(false),
    getBusinessesByCategory(categorySlug, { page: 1, pageSize: CATEGORY_LISTINGS_PAGE_SIZE }),
  ]);

  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find((c: { slug?: string; name?: string }) => c.slug === categorySlug) || {
    name: categorySlug === 'all' ? 'All Services' : categorySlug.replace(/-/g, ' '),
    slug: categorySlug,
  };

  const initialBusinesses = bizResult.success && bizResult.businesses ? bizResult.businesses : [];
  const total = bizResult.success ? (bizResult.total ?? initialBusinesses.length) : 0;
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
    <div className="bg-accent/30 min-h-[calc(100dvh-6.75rem)] pt-24 pb-12 lg:min-h-screen lg:pt-32">
      <JsonLd data={jsonLd} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-4">
            {currentCategory.name}
          </h1>
          <p className="text-gray-500 font-medium">
            {total > 0
              ? `${total} business${total !== 1 ? 'es' : ''} in this category`
              : 'No businesses found yet'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 space-y-8">
            <div className="bg-white p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter size={18} className="text-blue-600" />
                <h3 className="font-black text-gray-900 uppercase text-sm">Filters</h3>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-xs font-black text-gray-400 uppercase">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    placeholder="Search city..."
                  />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <label className="text-xs font-black text-gray-400 uppercase">Minimum Rating</label>
                <div className="space-y-2">
                  {[4, 3, 2].map((r) => (
                    <label key={r} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-700">{r}+</span>
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase">Price Range</label>
                <div className="space-y-2">
                  {['Budget', 'Mid-range', 'Premium'].map((p) => (
                    <label key={p} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-bold text-gray-700">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {relatedCategories.length > 0 ? (
              <RelatedCategoryLinks title="Related categories" links={relatedCategories} />
            ) : null}
          </aside>

          <div className="flex-1">
            <CategoryBusinessList
              categorySlug={categorySlug}
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
