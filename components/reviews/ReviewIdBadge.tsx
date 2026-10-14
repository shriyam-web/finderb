'use client';

import { useState } from 'react';

type ReviewIdBadgeProps = {
  reviewId: string;
  tone?: 'stone' | 'zinc';
};

export default function ReviewIdBadge({ reviewId, tone = 'stone' }: ReviewIdBadgeProps) {
  const [copied, setCopied] = useState(false);
  const shortId = reviewId.length > 8 ? reviewId.slice(0, 8) : reviewId;
  const border =
    tone === 'zinc'
      ? 'border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50'
      : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50';

  return (
    <button
      type="button"
      onClick={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(reviewId);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className={`inline-flex items-center rounded-md border bg-transparent px-2 py-0.5 font-mono text-[11px] leading-5 ${border}`}
      title="Copy review ID"
      aria-label={copied ? 'Review ID copied' : `Copy review ID ${shortId}`}
    >
      {copied ? 'Copied' : shortId}
    </button>
  );
}
