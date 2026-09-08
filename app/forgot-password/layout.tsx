import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Forgot password',
  description: 'Reset your FinderB account password with a one-time email code.',
  canonicalPath: '/forgot-password',
  robots: NO_INDEX_ROBOTS,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
