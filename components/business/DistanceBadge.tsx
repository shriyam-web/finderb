import { ArrowUpRight, Navigation } from 'lucide-react';

type DistanceBadgeProps = {
  label: string;
  mapsHref: string;
};

function splitDistanceLabel(label: string): { distance: string; suffix: string | null } {
  const trimmed = label.trim();
  const match = trimmed.match(/^(.+?)\s+(away)$/i);
  if (!match) return { distance: trimmed, suffix: null };
  return { distance: match[1], suffix: 'away' };
}

export default function DistanceBadge({ label, mapsHref }: DistanceBadgeProps) {
  const { distance, suffix } = splitDistanceLabel(label);

  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
      title="Open directions in Google Maps"
      aria-label={`${label}. Open directions in Google Maps`}
      className="group inline-flex w-fit max-w-full items-center gap-2.5 rounded-full border border-stone-200/90 bg-white py-1 pl-1 pr-3 shadow-[0_1px_2px_rgba(28,25,23,0.06)] transition-all hover:border-amber-200/90 hover:bg-[#fffdf8] hover:shadow-[0_4px_14px_rgba(180,83,9,0.1)] active:scale-[0.99]"
    >
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-50 text-amber-700 ring-1 ring-amber-200/60">
        <Navigation size={13} strokeWidth={2.5} aria-hidden />
      </span>

      <span className="min-w-0 text-sm leading-none">
        <span className="font-semibold text-stone-800">{distance}</span>
        {suffix ? <span className="ml-1 font-medium text-stone-500">{suffix}</span> : null}
      </span>

      <span className="h-3.5 w-px shrink-0 bg-stone-200" aria-hidden />

      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-stone-600 transition-colors group-hover:text-amber-800">
        Directions
        <ArrowUpRight
          size={13}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </span>
    </a>
  );
}
