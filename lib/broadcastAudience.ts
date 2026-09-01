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
