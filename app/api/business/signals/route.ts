import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { loadPublicBusinessSignals, loadPublicSignalsForIds } from '@/lib/publicBusinessSignals';
import { getPublicSupabase } from '@/lib/supabase/public';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function cacheHeaders(fresh: boolean) {
  return {
    ...CORS,
    'Cache-Control': fresh ? 'private, no-store' : 'public, max-age=15, s-maxage=30',
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fresh = url.searchParams.get('fresh') === '1';
  const ids = (url.searchParams.get('ids') || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (ids.length) {
    const load = () => loadPublicSignalsForIds(ids);
    const signals = fresh
      ? await load()
      : await unstable_cache(load, ['business-signals-batch', [...ids].sort().join(',')], { revalidate: 30 })();
    return NextResponse.json({ signals }, { headers: cacheHeaders(fresh) });
  }

  const id = url.searchParams.get('id')?.trim() || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: CORS });

  const loadOne = async () => {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase.from('Business').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    if (String(data.status || '').toLowerCase() !== 'active') return null;
    return loadPublicBusinessSignals(data);
  };
  const signals = fresh
    ? await loadOne()
    : await unstable_cache(loadOne, ['business-signals', id], { revalidate: 30 })();

  if (!signals) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  return NextResponse.json(signals, { headers: cacheHeaders(fresh) });
}
