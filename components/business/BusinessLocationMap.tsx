import { ExternalLink, MapPin } from 'lucide-react';

type BusinessLocationMapProps = {
  businessName: string;
  embedSrc?: string | null;
  directionsHref?: string;
  address?: string | null;
  className?: string;
};

export default function BusinessLocationMap({
  businessName,
  embedSrc,
  directionsHref,
  address,
  className = '',
}: BusinessLocationMapProps) {
  if (!embedSrc && !directionsHref) return null;

  if (embedSrc) {
    const isOpenStreetMap = embedSrc.includes('openstreetmap.org');

    return (
      <div
        className={`relative overflow-hidden rounded-lg border border-stone-200/80 bg-[#e8eef4] ${className}`}
      >
        <iframe
          title={`Map for ${businessName}`}
          src={embedSrc}
          className="block h-52 w-full border-0 sm:h-60 lg:h-72"
          loading="lazy"
          referrerPolicy="no-referrer-when-cross-origin"
          allowFullScreen
        />
        {isOpenStreetMap ? (
          <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-white/90 px-1.5 py-0.5 text-[9px] text-stone-500 shadow-sm">
            © OpenStreetMap
          </span>
        ) : null}
        {directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-white/80 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#215481] shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ExternalLink size={13} />
            Open in Google Maps
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-stone-200/80 bg-gradient-to-br from-[#f4f7fb] via-[#e9eef5] to-[#dde7f2] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative flex h-52 flex-col items-center justify-center gap-3 px-6 text-center sm:h-60 lg:h-72">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#215481] shadow-sm ring-1 ring-stone-200/80">
          <MapPin size={20} strokeWidth={2.25} />
        </span>
        {address ? (
          <p className="max-w-md text-sm leading-snug text-stone-700">{address}</p>
        ) : (
          <p className="text-sm text-stone-600">View this business on the map</p>
        )}
        {directionsHref ? (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#215481] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a4367]"
          >
            <ExternalLink size={14} />
            Open in Google Maps
          </a>
        ) : null}
      </div>
    </div>
  );
}
