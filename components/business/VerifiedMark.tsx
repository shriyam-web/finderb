import { BadgeCheck } from 'lucide-react';

export function VerifiedNameTick({
  className = '',
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <BadgeCheck
      size={size}
      strokeWidth={2}
      className={`inline shrink-0 text-emerald-600 ${className}`}
      aria-label="Verified business"
    />
  );
}
