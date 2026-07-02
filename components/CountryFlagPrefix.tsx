import { countryFlagEmoji } from '@/lib/countryFlag';

export default function CountryFlagPrefix({
  isoCode,
  className = '',
}: {
  isoCode: string;
  className?: string;
}) {
  const flag = countryFlagEmoji(isoCode);
  if (!flag) return null;

  return (
    <span
      className={`inline-flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-black/10 bg-white text-[17px] leading-none shadow-sm ${className}`}
      aria-hidden
    >
      {flag}
    </span>
  );
}
