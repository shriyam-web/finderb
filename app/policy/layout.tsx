import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Infringement Policy',
  description: 'FinderB infringement and intellectual property policy for reported content and takedown requests.',
  canonicalPath: '/policy',
});

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
