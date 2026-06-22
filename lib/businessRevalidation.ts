import { revalidatePath } from 'next/cache';
import { revalidateSitemap } from '@/lib/sitemapData';
import { getBusinessProfilePath } from '@/lib/businessSlug';

/** Revalidate ISR/HTML cache after a business profile or slug changes. */
export function revalidateBusinessProfilePaths(business: {
  id: string;
  slug?: string | null;
}) {
  const canonicalPath = getBusinessProfilePath(business);
  revalidatePath(canonicalPath);
  revalidatePath(`/business/${business.id}`);
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap');
  revalidateSitemap();
}
