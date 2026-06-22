import type { Metadata } from 'next';
import MoviesListingClient from '@/components/movies/MoviesListingClient';
import { buildPageMetadata } from '@/lib/seoUtils';

export const metadata: Metadata = buildPageMetadata({
  title: 'Movies & Showtimes',
  description:
    'Browse movies, ratings, and showtimes on FinderB. Discover what is playing near you across India.',
  canonicalPath: '/movies',
  keywords: ['movies India', 'showtimes', 'film ratings', 'FinderB movies'],
});

export default function MoviesListingPage() {
  return <MoviesListingClient />;
}
