import type { Metadata } from 'next';
import { Suspense } from 'react';
import CategoriesPageClient from '@/components/categories/CategoriesPageClient';
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

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#f7f7f8]" />}>
      <CategoriesPageClient />
    </Suspense>
  );
}
