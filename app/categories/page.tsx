import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getCategories } from '@/app/actions/category';
import CategoriesPageClient from '@/components/categories/CategoriesPageClient';
import CategoriesBrowseFallback from '@/components/categories/CategoriesBrowseFallback';
import {
  buildCategoryIndexMetadata,
  buildCategorySearchMetadata,
} from '@/lib/categorySeo';

type PageProps = {
  searchParams: Promise<{ search?: string; id?: string; sub?: string }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const search = params.search?.trim();

  if (search) {
    return buildCategorySearchMetadata(search);
  }

  return buildCategoryIndexMetadata();
}

export default async function CategoriesPage() {
  const catResult = await getCategories(false);
  const initialCategories =
    catResult.success && catResult.categories ? catResult.categories : [];

  return (
    <Suspense fallback={<CategoriesBrowseFallback />}>
      <CategoriesPageClient initialCategories={initialCategories} />
    </Suspense>
  );
}
