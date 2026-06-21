import HomeClient from '@/components/HomeClient';
import type { Metadata } from 'next';
import { getCachedHomePageData } from '@/lib/homePageData';
import {
  HOME_PAGE_DESCRIPTION,
  HOME_PAGE_TITLE,
  SITE_HOME_URL,
  SITE_NAME,
} from '@/lib/siteSeo';
import HomeStructuredData from '@/components/HomeStructuredData';

export const revalidate = 300;

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
  const initialData = await getCachedHomePageData();

  return (
    <>
      <HomeStructuredData />
      <HomeClient initialData={initialData} />
    </>
  );
}
