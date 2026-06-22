import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Create Account',
    description:
      'Create a free FinderB account to save listings, write reviews, and discover trusted local businesses near you.',
    canonicalPath: '/signup',
    robots: NO_INDEX_ROBOTS,
  }),
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
