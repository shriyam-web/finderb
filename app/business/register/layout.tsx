import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Business',
  description:
    'List your business on FinderB for free. Reach local customers, collect reviews, and grow visibility across India.',
  alternates: { canonical: '/business/register' },
};

export default function BusinessRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
