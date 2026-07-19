type MerchantJobBadgeProps = {
  compact?: boolean;
  className?: string;
  count?: number;
  onClick?: () => void;
};

export default function MerchantJobBadge({
  compact = false,
  className = '',
  count,
  onClick,
}: MerchantJobBadgeProps) {
  const multi = typeof count === 'number' && count > 1;
  const classes = `merchant-job-badge inline-flex flex-col items-center justify-center border border-dashed border-sky-400 bg-sky-50 text-center font-extrabold uppercase leading-none text-sky-600 ${
    compact ? 'min-w-[2.1rem] gap-0.5 px-1 py-1' : 'min-w-[2.4rem] gap-0.5 px-1.5 py-1.5'
  } ${onClick ? 'cursor-pointer transition-colors hover:border-sky-500 hover:bg-sky-100' : ''} ${className}`;

  const content = (
    <>
      <span className={`tracking-[0.18em] ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
        {multi ? `${count}` : 'Open'}
      </span>
      <span className={`tracking-[0.14em] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        Job{multi ? 's' : ''}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        title="View open positions"
        aria-label="View open job positions"
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={classes}
      title="This business is hiring"
      aria-label="Job openings available"
    >
      {content}
    </span>
  );
}
