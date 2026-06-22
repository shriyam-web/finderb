import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Careers at FinderB',
  description: 'Explore job openings and career opportunities at FinderB, India\'s local business discovery platform.',
  canonicalPath: '/hirings',
});

export default function HiringsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
