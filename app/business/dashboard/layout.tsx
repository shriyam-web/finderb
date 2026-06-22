import type { Metadata } from 'next';
import { NO_INDEX_ROBOTS, buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Business Dashboard',
  description: 'FinderB merchant dashboard for managing listings, leads, and reviews.',
  canonicalPath: '/business/dashboard',
  robots: NO_INDEX_ROBOTS,
});

export default function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="merchant-dashboard merchant-dashboard-canvas min-h-screen font-sans antialiased">
      {children}
    </div>
  );
}
