import type { Metadata } from 'next';
import { SITE_NAME, SITE_ORIGIN } from '@/lib/siteSeo';

export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function resolveAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export const NO_INDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export const INDEX_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
};

type PageMetadataInput = {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  keywords?: string[];
  robots?: Metadata['robots'];
};

export function buildPageMetadata({
  title,
  description,
  canonicalPath,
  ogImage = '/logo1.png',
  keywords,
  robots = INDEX_ROBOTS,
}: PageMetadataInput): Metadata {
  const canonicalUrl = resolveAbsoluteUrl(canonicalPath);
  const imageUrl = resolveAbsoluteUrl(ogImage);

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@finderb',
      creator: '@finderb',
      title,
      description,
      images: { url: imageUrl, alt: title },
    },
    robots,
  };
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: resolveAbsoluteUrl(item.path),
    })),
  };
}

export function buildJsonLdGraph(...nodes: Record<string, unknown>[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
