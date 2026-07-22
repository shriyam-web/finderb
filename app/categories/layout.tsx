import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { buildCategoryIndexMetadata } from '@/lib/categorySeo';

/** Index-only metadata — child `/categories/[slug]` pages set their own canonicals. */
export const metadata: Metadata = buildCategoryIndexMetadata();

const categoriesUi = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${categoriesUi.variable} min-h-0 flex-1`}>{children}</div>;
}
