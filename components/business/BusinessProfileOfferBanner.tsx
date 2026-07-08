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
    <div className="profile-offer-card overflow-hidden rounded-lg border border-emerald-200/80 bg-white shadow-[0_1px_3px_rgba(4,120,87,0.06)]">
      <div className="flex min-h-[4.5rem]">
        <div className="profile-offer-card__stub relative flex w-[4.25rem] shrink-0 flex-col items-center justify-center gap-1 border-r border-dashed border-emerald-200/90 bg-gradient-to-b from-emerald-50 to-emerald-100/50 px-2 py-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/80">
            <Tag size={15} strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-center text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-emerald-900/85">
            Current
            <br />
            offer
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[1.35rem] font-extrabold leading-none tracking-tight text-[#153551] sm:text-2xl">
              {primary}
            </span>
            {secondary ? (
              <span className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                {secondary}
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-xs leading-relaxed text-stone-600 sm:text-[13px]">{detail}</p>

          {showExtraLabel ? (
            <p className="mt-1.5 text-[11px] font-medium text-emerald-800/70">{label}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
