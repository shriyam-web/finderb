import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Business Login',
    description:
      'Sign in to your FinderB business dashboard to manage listings, leads, reviews, and merchant settings.',
    canonicalPath: '/business/login',
    robots: NO_INDEX_ROBOTS,
  }),
};

export default function BusinessLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
