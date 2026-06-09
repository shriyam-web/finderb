import { BadgeCheck } from 'lucide-react';

export function VerifiedNameTick({ className = '' }: { className?: string }) {
  return (
    <BadgeCheck
      size={22}
      strokeWidth={2}
      className={`inline shrink-0 align-middle text-emerald-600 ${className}`}
      aria-label="Verified business"
    />
  );
}
