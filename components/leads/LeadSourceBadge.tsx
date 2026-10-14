import { leadSourceKind, normalizeLeadSource } from '@/lib/leadBadges';

export default function LeadSourceBadge({ source }: { source: string | null | undefined }) {
  const kind = leadSourceKind(source);
  const label = normalizeLeadSource(source);
  if (!kind || !label) return null;

  if (kind === 'direct') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-br from-[#6d28d9] via-[#5b21b6] to-[#312e81] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_6px_14px_rgba(91,33,182,0.28)]">
        <span aria-hidden>⚡</span>
        Direct
      </span>
    );
  }

  if (kind === 'profile') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#0b2236] bg-[#12324c] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#d7e8f7] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#3dd6c6] shadow-[0_0_0_3px_rgba(61,214,198,0.18)]" aria-hidden />
        On your profile
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#c79212] bg-[linear-gradient(135deg,#fff8df_0%,#f6c63d_52%,#e39b12_100%)] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#5a3b04] shadow-[0_4px_10px_rgba(227,155,18,0.22)]">
      <span aria-hidden>★</span>
      Popular in category
    </span>
  );
}
