import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getCategories } from '@/app/actions/category';
import { getBusinessesByCategory } from '@/app/actions/business';
import CategoryBusinessList from '@/components/category/CategoryBusinessList';
import { CATEGORY_LISTINGS_PAGE_SIZE } from '@/lib/categoryListings';

const ADMISSIONS_SLUG = 'admissions';

export const metadata: Metadata = {
  title: 'Admissions',
  description:
    'Explore schools, colleges, coaching centres, and admission consultants listed on FinderB.',
  alternates: { canonical: '/categories/admissions' },
};

export default async function AdmissionsPage() {
  const [catResult, bizResult] = await Promise.all([
    getCategories(false),
    getBusinessesByCategory(ADMISSIONS_SLUG, {
      page: 1,
      pageSize: CATEGORY_LISTINGS_PAGE_SIZE,
    }),
  ]);

  const allCategories = catResult.success && catResult.categories ? catResult.categories : [];
  const currentCategory = allCategories.find((c) => c.slug === ADMISSIONS_SLUG) ?? {
    name: 'Admissions',
    slug: ADMISSIONS_SLUG,
  };

  const initialBusinesses = bizResult.success && bizResult.businesses ? bizResult.businesses : [];
  const total = bizResult.success ? (bizResult.total ?? initialBusinesses.length) : 0;

  return (
    <div className="min-h-[calc(100dvh-6.75rem)] bg-[#f8fafc] pb-24 font-sans lg:min-h-screen lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] sm:text-3xl">
            FinderB <span className="text-[#2563eb]">Admissions</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Schools, colleges, coaching centres, and admission consultants near you.
            {total > 0
              ? ` ${total} listing${total !== 1 ? 's' : ''} in ${currentCategory.name}.`
              : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <CategoryBusinessList
          categorySlug={ADMISSIONS_SLUG}
          initialBusinesses={initialBusinesses}
          initialTotal={total}
          pageSize={CATEGORY_LISTINGS_PAGE_SIZE}
        />
      </div>
    </div>
  );
}
