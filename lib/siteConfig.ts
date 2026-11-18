import { revalidateTag, unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getPublicSupabase } from '@/lib/supabase/public';
import { s3Env } from '@/lib/media/env';
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
  MediaProvider,
  SiteBilling,
  SiteConfig,
  SiteContact,
  SiteFeatures,
  SiteMedia,
  SitePricing,
} from '@/lib/siteConfigShared';

const SITE_CONFIG_CACHE_SECONDS = 15 * 60;
const SITE_CONFIG_CACHE_TAG = 'site-config';

export function clearSiteConfigCache() {
  revalidateTag(SITE_CONFIG_CACHE_TAG, 'max');
}

function withStorageReady(config: SiteConfig): SiteConfig {
  return {
    ...config,
    media: {
      provider: config.media.provider,
      ready: s3Env().ready,
    },
  };
}

async function readSiteConfig(): Promise<SiteConfig> {
  const client = createServiceClient() ?? getPublicSupabase();
  const { data, error } = await client
    .from('site_config')
    .select('config')
    .eq('id', SITE_CONFIG_ID)
    .maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Site config is missing');
  return parseSiteConfig((data as { config?: unknown }).config);
}

const readCachedSiteConfig = unstable_cache(readSiteConfig, ['site-config-v1'], {
  revalidate: SITE_CONFIG_CACHE_SECONDS,
  tags: [SITE_CONFIG_CACHE_TAG],
});

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    return withStorageReady(await readCachedSiteConfig());
  } catch {
    return withStorageReady(DEFAULT_SITE_CONFIG);
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
  clearSiteConfigCache();
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
