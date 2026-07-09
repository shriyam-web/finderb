import { Tag } from 'lucide-react';

type BusinessProfileOfferBannerProps = {
  headline: string;
  detail: string;
  label: string;
};

function splitHeadline(headline: string): { primary: string; secondary: string | null } {
  const trimmed = headline.trim();
  const offMatch = trimmed.match(/^(.+?)\s+(off)$/i);
  if (offMatch) {
    return { primary: offMatch[1], secondary: 'off' };
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return {
      primary: words.slice(0, -1).join(' '),
      secondary: words[words.length - 1],
    };
  }

  return { primary: trimmed, secondary: null };
}

export default function BusinessProfileOfferBanner({
  headline,
  detail,
  label,
}: BusinessProfileOfferBannerProps) {
  const { primary, secondary } = splitHeadline(headline);
  const showExtraLabel =
    !label.includes('%') && label.toLowerCase() !== headline.toLowerCase();

  return (
    <div className="profile-offer-card relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-cyan-50/70">
      <div className="flex min-h-[5.25rem]">
        <div className="profile-offer-card__stub relative flex w-[4.8rem] shrink-0 flex-col items-center justify-center gap-1.5 border-r border-dashed border-emerald-300/80 bg-gradient-to-b from-emerald-500/15 via-emerald-100/75 to-emerald-50 px-2 py-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200/80">
            <Tag size={15} strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-center text-[9px] font-extrabold uppercase leading-tight tracking-[0.14em] text-emerald-900/85">
            Current
            <br />
            offer
          </span>
        </div>

        <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
          <div className="mb-1.5">
            <span className="inline-flex items-center rounded-full border border-emerald-300/70 bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800">
              Limited offer
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[1.55rem] font-black leading-none tracking-tight text-[#153551] sm:text-[1.75rem]">
              {primary}
            </span>
            {secondary ? (
              <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                {secondary}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-[13px]">{detail}</p>

          {showExtraLabel ? (
            <p className="mt-1.5 inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {label}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
