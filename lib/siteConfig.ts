import { unstable_noStore as noStore } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getPublicSupabase } from '@/lib/supabase/public';
import {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_ID,
  parseSiteConfig,
  type SiteConfig,
} from '@/lib/siteConfigShared';

export {
  DEFAULT_SITE_CONFIG,
  SITE_CONFIG_ID,
  parseSiteConfig,
  publicSiteConfig,
} from '@/lib/siteConfigShared';
export type {
  SiteBilling,
  SiteConfig,
  SiteContact,
  SiteFeatures,
  SitePricing,
} from '@/lib/siteConfigShared';

let cache: { at: number; config: SiteConfig } | null = null;
const CACHE_MS = 15_000;

export function clearSiteConfigCache() {
  cache = null;
}

export async function getSiteConfig(): Promise<SiteConfig> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.config;
  noStore();
  try {
    const client = createServiceClient() ?? getPublicSupabase();
    const { data, error } = await client
      .from('site_config')
      .select('config')
      .eq('id', SITE_CONFIG_ID)
      .maybeSingle();
    if (error || !data) return DEFAULT_SITE_CONFIG;
    const config = parseSiteConfig((data as { config?: unknown }).config);
    cache = { at: Date.now(), config };
    return config;
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function saveSiteConfig(config: SiteConfig): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = createServiceClient();
  if (!client) return { ok: false, error: 'Site configuration storage is not available.' };
  const next = parseSiteConfig(config);
  const { error } = await client.from('site_config').upsert(
    {
      id: SITE_CONFIG_ID,
      config: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) return { ok: false, error: error.message };
  cache = { at: Date.now(), config: next };
  return { ok: true };
}

export async function saveMonthlyPlanId(planId: string): Promise<void> {
  const current = await getSiteConfig();
  await saveSiteConfig({
    ...current,
    billing: { razorpayMonthlyPlanId: planId },
  });
}

export async function isPromoteBusinessOnlineEnabled(): Promise<boolean> {
  const config = await getSiteConfig();
  return config.features.promoteBusinessOnline;
}
