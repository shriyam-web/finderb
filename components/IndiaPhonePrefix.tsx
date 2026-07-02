export function IndiaFlag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[4px] shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.08] ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 21 14" className="h-[15px] w-[22px]" role="img" aria-label="India">
        <rect width="21" height="4.67" fill="#FF9933" />
        <rect y="4.67" width="21" height="4.66" fill="#FFFFFF" />
        <rect y="9.33" width="21" height="4.67" fill="#138808" />
        <circle cx="10.5" cy="7" r="1.75" fill="none" stroke="#000080" strokeWidth="0.45" />
        <circle cx="10.5" cy="7" r="0.35" fill="#000080" />
      </svg>
    </span>
  );
}

type IndiaPhonePrefixProps = {
  variant?: 'merchant' | 'dashboard';
};

export function IndiaPhonePrefix({ variant = 'dashboard' }: IndiaPhonePrefixProps) {
  if (variant === 'merchant') {
    return (
      <span className="merchant-auth-phone-prefix flex shrink-0 items-center gap-2.5 border-r-2 border-[#dfe6ee] bg-gradient-to-b from-white to-[#f3f6f9] px-3.5 py-3.5 sm:px-4 sm:py-4">
        <IndiaFlag />
        <span className="text-[15px] font-bold tracking-tight text-[#153551]">+91</span>
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-2 border-r border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <IndiaFlag />
      <span className="text-sm font-semibold tabular-nums text-[#153551]">+91</span>
    </span>
  );
}
