import type { Metadata } from 'next';
import { buildCategoryIndexMetadata } from '@/lib/categorySeo';

/** Index-only metadata — child `/categories/[slug]` pages set their own canonicals. */
export const metadata: Metadata = buildCategoryIndexMetadata();

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
