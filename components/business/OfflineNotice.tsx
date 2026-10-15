'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineNotice() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white px-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
          <WifiOff size={22} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-zinc-600">No internet connection</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          FinderB needs the internet to load your business dashboard. Check your connection, then this screen will
          close on its own.
        </p>
      </div>
    </div>
  );
}
