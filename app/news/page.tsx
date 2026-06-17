import type { Metadata } from 'next';
import NewsPageContent from '@/components/news/NewsPageContent';

export const metadata: Metadata = {
  title: 'FinderB News',
  description:
    'Local and national news on FinderB — politics, business, sports, technology, and headlines from your city.',
  alternates: { canonical: '/news' },
};

export default function NewsPage() {
  return <NewsPageContent />;
}
