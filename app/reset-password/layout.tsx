import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Reset password',
  description: 'Choose a new password for your FinderB account.',
  canonicalPath: '/reset-password',
  robots: NO_INDEX_ROBOTS,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
