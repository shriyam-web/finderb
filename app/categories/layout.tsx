import type { Metadata } from 'next';
import { plusJakarta } from '@/lib/fonts';
import { buildCategoryIndexMetadata } from '@/lib/categorySeo';

/** Index-only metadata — child `/categories/[slug]` pages set their own canonicals. */
export const metadata: Metadata = buildCategoryIndexMetadata();

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${plusJakarta.variable} min-h-0 flex-1`}>{children}</div>;
}
