import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

/** On the server this reads with the service role; the anon key only exposes a few public columns. */
export function getPublicSupabase() {
  if (typeof window === 'undefined') {
    const service = createServiceClient();
    if (service) return service;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createClient(url, key);
}
