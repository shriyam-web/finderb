import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Categories',
  description:
    'Browse local business categories on FinderB — restaurants, doctors, plumbers, salons, education, real estate, and 500+ services across India.',
  alternates: { canonical: '/categories' },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
