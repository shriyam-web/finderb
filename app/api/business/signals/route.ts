import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { loadPublicBusinessSignals } from '@/lib/publicBusinessSignals';
import { getPublicSupabase } from '@/lib/supabase/public';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim() || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400, headers: CORS });

  const signals = await unstable_cache(
    async () => {
      const supabase = getPublicSupabase();
      const { data, error } = await supabase.from('Business').select('*').eq('id', id).maybeSingle();
      if (error || !data) return null;
      if (String(data.status || '').toLowerCase() !== 'active') return null;
      return loadPublicBusinessSignals(data);
    },
    ['business-signals', id],
    { revalidate: 600 },
  )();

  if (!signals) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS });
  return NextResponse.json(signals, { headers: CORS });
}
