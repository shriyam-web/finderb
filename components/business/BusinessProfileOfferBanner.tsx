type BusinessProfileOfferBannerProps = {
  headline: string;
  detail: string;
  label: string;
};

export default function BusinessProfileOfferBanner({
  headline,
  detail,
  label,
}: BusinessProfileOfferBannerProps) {
  return (
    <div className="border-l-[3px] border-[#e8a045] bg-[#fffdf8] py-3 pl-3.5 pr-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#b45309]/80">
        Current offer
      </p>
      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-[#153551]">{headline}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">{detail}</p>
      {!label.includes('%') && label.toLowerCase() !== headline.toLowerCase() && (
        <p className="mt-1 text-xs text-stone-400">{label}</p>
      )}
    </div>
  );
}
