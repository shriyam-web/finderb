export default function CountryFlagPrefix({
  isoCode,
  className = '',
}: {
  isoCode: string;
  className?: string;
}) {
  const code = isoCode?.trim().toLowerCase();
  if (!code || code.length !== 2) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={28}
      height={20}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      className={`h-5 w-7 shrink-0 rounded-[3px] border border-black/10 object-cover shadow-sm ${className}`}
    />
  );
}
