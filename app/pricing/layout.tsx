import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Premium & Pricing',
  description:
    'FinderB premium plans for businesses — verified badges, priority visibility, and tools to grow your local presence.',
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
