import type { Metadata } from 'next';
import { LEGAL_COMPANY } from '@/lib/legalContent';
import { FOOTER_SOCIAL_LINKS } from '@/lib/footerData';

export const SITE_NAME = 'FinderB';
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';

/** Meta app ID for fb:app_id (Facebook Sharing Debugger / WhatsApp link previews). */
export function getFacebookMetadata(): Metadata['facebook'] | undefined {
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  if (!appId) return undefined;
  return { appId };
}
/** Canonical home URL — trailing slash per Google site-name guidelines. */
export const SITE_HOME_URL = `${SITE_ORIGIN}/`;

/** Homepage search snippet — short title + description (Sulekha-style). */
export const HOME_PAGE_TITLE =
  "FinderB - India's Local Business Directory & Discovery Platform";
export const HOME_PAGE_DESCRIPTION =
  'Discover verified local businesses, restaurants, hotels, doctors, tutors, salons, lawyers, contractors and more across India with FinderB.';

/** Primary pages Google may show as sitelinks — linked from homepage + schema. */
export const SITELINK_NAV_LINKS = [
  {
    name: 'All Categories',
    path: '/categories',
    description: 'Browse local business categories and services across India.',
  },
  {
    name: 'Tourist Places',
    path: '/tourist-places',
    description: 'Explore tourist destinations, landmarks, and attractions across India.',
  },
  {
    name: 'Business Listings',
    path: '/categories/restaurants',
    description: 'Find verified local business listings with ratings, reviews, and contact details.',
  },
  {
    name: 'Blog',
    path: '/blog',
    description: 'Local business guides, city insights, and discovery tips from FinderB.',
  },
  {
    name: 'Premium & Pricing',
    path: '/pricing',
    description: 'FinderB premium plans, verified badges, and business listing upgrades.',
  },
  {
    name: 'Register Business',
    path: '/business/register',
    description: 'Add a free business listing on FinderB and reach customers in your city.',
  },
  {
    name: 'About FinderB',
    path: '/about',
    description: 'Learn about FinderB, India\'s local discovery and business directory platform.',
  },
] as const;

const facebookMetadata = getFacebookMetadata();

export const rootSiteMetadata: Metadata = {
  title: {
    default: HOME_PAGE_TITLE,
    template: '%s | FinderB',
  },
  description: HOME_PAGE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: LEGAL_COMPANY.name,
  metadataBase: new URL(SITE_ORIGIN),
  alternates: {
    canonical: SITE_HOME_URL,
  },
  openGraph: {
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
    url: SITE_HOME_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: '/logo1.png',
        width: 1200,
        height: 630,
        alt: "FinderB - India's Premier Local Discovery Platform",
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_PAGE_TITLE,
    description: HOME_PAGE_DESCRIPTION,
    images: ['/logo1.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Business',
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  ...(facebookMetadata ? { facebook: facebookMetadata } : {}),
};

/** Single @graph block for Organization + WebSite (Google site-name guidelines). */
export function getRootStructuredData() {
  const organizationId = `${SITE_ORIGIN}/#organization`;
  const websiteId = `${SITE_ORIGIN}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        legalName: LEGAL_COMPANY.name,
        url: SITE_HOME_URL,
        logo: `${SITE_ORIGIN}/logo1.png`,
        description:
          "FinderB is India's premium local discovery platform connecting users with verified professionals and top-rated services across 300+ cities.",
        sameAs: FOOTER_SOCIAL_LINKS.map((item) => item.href),
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: LEGAL_COMPANY.phone,
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['en', 'hi'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: SITE_HOME_URL,
        name: SITE_NAME,
        alternateName: ['FinderB India', 'finderb.com'],
        publisher: { '@id': organizationId },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_ORIGIN}/categories?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/** Homepage-only navigation schema to help Google generate sitelinks. */
export function getHomeNavigationStructuredData() {
  const navigationElements = SITELINK_NAV_LINKS.map((link, index) => ({
    '@type': 'SiteNavigationElement',
    '@id': `${SITE_ORIGIN}${link.path}#navigation`,
    name: link.name,
    url: `${SITE_ORIGIN}${link.path}`,
    description: link.description,
    position: index + 1,
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        '@id': `${SITE_HOME_URL}#primary-nav`,
        name: 'Popular pages on FinderB',
        itemListElement: SITELINK_NAV_LINKS.map((link, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: link.name,
          url: `${SITE_ORIGIN}${link.path}`,
          description: link.description,
        })),
      },
      ...navigationElements,
    ],
  };
}
