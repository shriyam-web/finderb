import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPublicSupabase } from '@/lib/supabase/public';

export const SITE_RUNTIME_ID = 'finderb';

export type SiteMode = 'normal' | 'text_only' | 'maintenance';

export type SiteRuntime = {
  mode: SiteMode;
  message: string;
  until: string | null;
  startedAt: string | null;
  updatedAt: string | null;
};

export const DEFAULT_MAINTENANCE_MESSAGE =
  'FinderB is temporarily unavailable while we finish a short update. Please check back soon.';

function isSiteMode(value: unknown): value is SiteMode {
  return value === 'normal' || value === 'text_only' || value === 'maintenance';
}

export function parseSiteRuntime(row: Record<string, unknown> | null | undefined): SiteRuntime {
  return {
    mode: isSiteMode(row?.mode) ? row.mode : 'normal',
    message: String(row?.message || '').trim() || DEFAULT_MAINTENANCE_MESSAGE,
    until: row?.until ? String(row.until) : null,
    startedAt: row?.started_at ? String(row.started_at) : null,
    updatedAt: row?.updated_at ? String(row.updated_at) : null,
  };
}

export function effectiveSiteMode(runtime: SiteRuntime, now = Date.now()): SiteMode {
  if (runtime.mode !== 'maintenance') return runtime.mode;
  if (!runtime.until) return 'maintenance';
  const until = Date.parse(runtime.until);
  if (Number.isFinite(until) && until <= now) return 'normal';
  return 'maintenance';
}

const FALLBACK: SiteRuntime = {
  mode: 'normal',
  message: DEFAULT_MAINTENANCE_MESSAGE,
  until: null,
  startedAt: null,
  updatedAt: null,
};

export async function getSiteRuntime(): Promise<SiteRuntime> {
  noStore();
  await connection();
  try {
    const client = createServiceClient() ?? getPublicSupabase();
    const { data, error } = await client
      .from('site_runtime')
      .select('mode, message, until, started_at, updated_at')
      .eq('id', SITE_RUNTIME_ID)
      .maybeSingle();
    if (error || !data) return FALLBACK;
    return parseSiteRuntime(data as Record<string, unknown>);
  } catch {
    return FALLBACK;
  }
}
