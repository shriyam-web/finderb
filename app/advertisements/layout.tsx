import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Advertise on FinderB',
  description:
    'Promote your business on FinderB with premium listings, featured placements, and targeted local advertising across India.',
  canonicalPath: '/advertisements',
});

export default function AdvertisementsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
