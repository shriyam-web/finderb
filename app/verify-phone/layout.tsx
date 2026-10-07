import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Verify your mobile',
  description: 'Add and verify your mobile number to finish setting up your FinderB account.',
  canonicalPath: '/verify-phone',
  robots: NO_INDEX_ROBOTS,
});

export default function VerifyPhoneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
