import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'My Dashboard',
  description: 'Your FinderB user dashboard.',
  canonicalPath: '/dashboard',
  robots: NO_INDEX_ROBOTS,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
