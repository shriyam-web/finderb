export function broadcastIsHeld(row: {
  status?: string | null;
  scheduled_at?: string | null;
}): boolean {
  const status = String(row.status || '').toLowerCase();
  if (status === 'queued') return true;
  const at = row.scheduled_at ? Date.parse(row.scheduled_at) : Number.NaN;
  if (status === 'scheduled' && (!Number.isFinite(at) || at > Date.now())) return true;
  return Number.isFinite(at) && at > Date.now();
}

function audienceList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
}

export function broadcastTargetsUsers(raw: unknown): boolean {
  const list = audienceList(raw);
  return list.includes('users') || list.includes('all');
}

export function broadcastTargetsMerchants(
  raw: unknown,
  category?: string | null
): boolean {
  const list = audienceList(raw);
  if (
    list.includes('merchants') ||
    list.includes('all') ||
    list.includes('service providers')
  ) {
    return true;
  }
  const cat = category?.trim().toLowerCase();
  return Boolean(cat && list.includes(cat));
}
