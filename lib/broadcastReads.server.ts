import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

export type BroadcastReaderType = 'user' | 'merchant';

export async function recordBroadcastReads(input: {
  readerId: string;
  readerType: BroadcastReaderType;
  broadcastIds: string[];
}): Promise<void> {
  const readerId = input.readerId.trim();
  const ids = [
    ...new Set(
      input.broadcastIds
        .map((id) => String(id || '').trim())
        .filter((id) => id.length > 0 && id.length < 80),
    ),
  ].slice(0, 80);

  if (!readerId || ids.length === 0) return;

  const supabase = createServiceClient();
  if (!supabase) return;

  const rows = ids.map((broadcast_id) => ({
    broadcast_id,
    reader_id: readerId,
    reader_type: input.readerType,
    read_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('broadcast_reads').upsert(rows, {
    onConflict: 'broadcast_id,reader_type,reader_id',
  });

  if (error && !/does not exist|schema cache/i.test(error.message || '')) {
    console.error('[broadcast reads]', error);
  }
}

export async function countBroadcastReads(
  broadcastIds: string[],
): Promise<Record<string, number>> {
  const ids = [...new Set(broadcastIds.map((id) => id.trim()).filter(Boolean))];
  const counts: Record<string, number> = {};
  for (const id of ids) counts[id] = 0;
  if (!ids.length) return counts;

  const supabase = createServiceClient();
  if (!supabase) return counts;

  const { data, error } = await supabase
    .from('broadcast_reads')
    .select('broadcast_id')
    .in('broadcast_id', ids);

  if (error) {
    if (!/does not exist|schema cache/i.test(error.message || '')) {
      console.error('[broadcast read counts]', error);
    }
    return counts;
  }

  for (const row of data || []) {
    const id = String((row as { broadcast_id?: string }).broadcast_id || '');
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}
