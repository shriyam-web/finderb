import type { Metadata } from 'next';
import { SITE_NAME, SITE_ORIGIN, getFacebookMetadata } from '@/lib/siteSeo';

export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const clean = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${clean.replace(/[\s,;:.\-–—|&/+]+$/, '')}…`;
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
  /** Shorter copy for link previews (WhatsApp, Facebook, Twitter). */
  openGraphTitle?: string;
  openGraphDescription?: string;
};

export function buildPageMetadata({
  title,
  description,
  canonicalPath,
  ogImage = '/brands/fb-mark-240.png',
  keywords,
  robots = INDEX_ROBOTS,
  openGraphTitle,
  openGraphDescription,
}: PageMetadataInput): Metadata {
  const canonicalUrl = resolveAbsoluteUrl(canonicalPath);
  const imageUrl = resolveAbsoluteUrl(ogImage);
  const shareTitle = openGraphTitle || title;
  const shareDescription = openGraphDescription || description;
  const facebookMetadata = getFacebookMetadata();

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title: shareTitle,
      description: shareDescription,
      siteName: SITE_NAME,
      locale: 'en_IN',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: shareTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@finderb',
      creator: '@finderb',
      title: shareTitle,
      description: shareDescription,
      images: { url: imageUrl, alt: shareTitle },
    },
    robots,
    ...(facebookMetadata ? { facebook: facebookMetadata } : {}),
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
