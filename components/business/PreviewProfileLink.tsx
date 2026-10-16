'use client';

import { useState } from 'react';

export default function PreviewProfileLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const go = (asVisitor: boolean) => {
    const url = new URL(href, window.location.origin);
    url.searchParams.set('view', asVisitor ? 'visitor' : 'owner');
    window.open(url.pathname + url.search, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-zinc-900/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-semibold text-zinc-900">Preview storefront</p>
            <p className="mt-1 text-xs text-zinc-500">Choose how this listing should open.</p>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => go(false)} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
                As your business
              </button>
              <button type="button" onClick={() => go(true)} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800">
                As a visitor
              </button>
              <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-zinc-500">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
