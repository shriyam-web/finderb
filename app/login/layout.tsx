import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
    title: 'Login',
    description:
      'Sign in to your FinderB account to save favourite businesses, manage your profile, and pick up where you left off.',
    canonicalPath: '/login',
  robots: NO_INDEX_ROBOTS,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
