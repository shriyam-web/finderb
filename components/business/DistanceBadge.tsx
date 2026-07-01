import { Navigation } from 'lucide-react';

type DistanceBadgeProps = {
  label: string;
  mapsHref: string;
};

export default function DistanceBadge({ label, mapsHref }: DistanceBadgeProps) {
  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
      title="Open in Google Maps"
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#215481]/25 bg-gradient-to-r from-[#215481]/10 to-[#f9b864]/10 px-3 py-1 text-xs font-semibold leading-tight text-[#215481] shadow-sm transition-all hover:border-[#215481]/40 hover:from-[#215481]/15 hover:to-[#f9b864]/15 hover:shadow-md active:scale-[0.98] sm:text-sm"
    >
      <Navigation size={14} className="shrink-0" strokeWidth={2.25} />
      <span>{label}</span>
    </a>
  );
}
