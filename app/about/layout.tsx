import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About FinderB',
  description:
    'Learn about FinderB — India\'s local business directory connecting users with verified services, professionals, and merchants across 300+ cities.',
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
