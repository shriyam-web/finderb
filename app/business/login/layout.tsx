import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Business Login',
  description:
    'Sign in to your FinderB business dashboard to manage listings, leads, reviews, and merchant settings.',
  alternates: { canonical: '/business/login' },
};

export default function BusinessLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
