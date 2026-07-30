'use client';

import { Loader2 } from 'lucide-react';

/** Suspense / first-paint shell so categories never flash a blank gray page. */
export default function CategoriesBrowseFallback() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f7f7f8] font-sans lg:h-screen">
      <header className="relative z-20 shrink-0 border-b border-slate-200/80 bg-white px-2.5 py-2 sm:px-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100" />
          <div className="h-9 flex-1 rounded-full bg-[#f7f7f8] ring-1 ring-slate-200/80" />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center gap-2 text-sm font-medium text-slate-500">
        <Loader2 size={16} className="animate-spin text-primary" />
        Loading categories…
      </div>
    </div>
  );
}
