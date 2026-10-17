import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { loadPublicBusinessSignals } from '@/lib/publicBusinessSignals';
import { getPublicSupabase } from '@/lib/supabase/public';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim() || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

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

  if (!signals) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(signals);
}
