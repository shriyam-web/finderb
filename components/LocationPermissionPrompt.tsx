'use client';

import { useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useUserLocationState } from '@/hooks/useUserCoords';

const DISMISS_KEY = 'finderb-location-prompt-dismissed';

type LocationPermissionPromptProps = {
  /** Only show after splash / main app is visible */
  appReady: boolean;
};

export default function LocationPermissionPrompt({ appReady }: LocationPermissionPromptProps) {
  const { userCoords, isLocating, permissionState, requestLocation } = useUserLocationState();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  });

  if (!appReady || dismissed) return null;

  if (userCoords || permissionState === 'denied' || permissionState === 'unsupported') {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-[5.5rem] z-[90] px-4 sm:bottom-6 lg:bottom-8">
      <div className="relative mx-auto flex max-w-lg flex-col gap-3 rounded-2xl border border-primary-100 bg-white p-4 shadow-xl shadow-primary-900/10 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <MapPin size={18} />
          </span>
          <div className="min-w-0 pr-6 sm:pr-0">
            <p className="text-sm font-semibold text-slate-900">Show accurate distances</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Allow location in your browser for precise distances on desktop and mobile. We never
              use approximate IP location.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            onClick={requestLocation}
            disabled={isLocating}
            className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocating ? 'Requesting…' : 'Allow location'}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
