import type { MetadataRoute } from 'next';
import { buildSitemap } from '@/lib/sitemapData';

/** Rebuild at most hourly — Googlebot was forcing a full catalog scan every hit. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap();
}
