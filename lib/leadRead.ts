export function isLeadUnread(lead: { merchant_read_at?: string | null }): boolean {
  return !lead.merchant_read_at;
}

export function formatResponseDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return 'under a minute';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hr' : `${hours} hr`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

export function averageLeadResponseMs(
  leads: Array<{ created_at?: string | null; merchant_read_at?: string | null }>,
): number | null {
  const samples = leads
    .map((lead) => {
      if (!lead.created_at || !lead.merchant_read_at) return null;
      const created = new Date(lead.created_at).getTime();
      const read = new Date(lead.merchant_read_at).getTime();
      if (!Number.isFinite(created) || !Number.isFinite(read) || read < created) return null;
      return read - created;
    })
    .filter((value): value is number => value != null);

  if (!samples.length) return null;
  return samples.reduce((sum, value) => sum + value, 0) / samples.length;
}

export function averageLeadResponseLabel(
  leads: Array<{ created_at?: string | null; merchant_read_at?: string | null }>,
): string | null {
  const mean = averageLeadResponseMs(leads);
  return mean == null ? null : formatResponseDuration(mean);
}
