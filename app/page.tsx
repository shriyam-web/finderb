import HomeClient from '@/components/HomeClient';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getCategories, getFeaturedGroups } from '@/app/actions/category';
import { getMovies } from '@/app/actions/movie';
import { getTouristPlaces } from '@/app/actions/touristPlace';
import { getBlogs } from '@/app/actions/blog';
import type { Metadata } from 'next';
import {
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  SITE_HOME_URL,
  SITE_NAME,
} from '@/lib/siteSeo';
import HomeStructuredData from '@/components/HomeStructuredData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: HOME_PAGE_TITLE,
  description: HOME_PAGE_DESCRIPTION,
  alternates: {
    canonical: SITE_HOME_URL,
  },
  openGraph: {
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
    url: SITE_HOME_URL,
    siteName: SITE_NAME,
  },
  twitter: {
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
  },
};
export default async function Home() {
  const [bizResult, catResult, movieResult, touristResult, blogResult, groupsResult] = await Promise.all([
    getFeaturedBusinesses(),
    getCategories(),
    getMovies(),
    getTouristPlaces(),
    getBlogs(),
    getFeaturedGroups(),
  ]);

  const initialData = {
    businesses: bizResult.success ? bizResult.businesses : [],
    categories: catResult.success ? catResult.categories : [],
    movies: movieResult.success ? movieResult.movies : [],
    touristPlaces: touristResult.success ? touristResult.touristPlaces : [],
    blogs: blogResult.success ? blogResult.blogs : [],
    featuredGroups: groupsResult.success ? groupsResult.groups ?? [] : [],
  };

  return (
    <>
      <HomeStructuredData />
      <HomeClient initialData={initialData} />
    </>
  );
}
