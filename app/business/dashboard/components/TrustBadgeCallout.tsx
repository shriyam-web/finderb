'use client';

import { HiOutlineShieldCheck } from 'react-icons/hi2';

type TrustBadgeCalloutProps = {
  isVerified: boolean;
};

export default function TrustBadgeCallout({ isVerified }: TrustBadgeCalloutProps) {
  if (!isVerified) return null;

  return (
    <p className="flex items-center gap-2 text-sm text-zinc-600">
      <HiOutlineShieldCheck size={18} className="shrink-0 text-[#f9b864]" />
      <span>
        <span className="font-semibold text-zinc-900">FinderB Verified</span>
        {' — '}Awarded by FinderB after review; shown on your public profile.
      </span>
    </p>
  );
}
