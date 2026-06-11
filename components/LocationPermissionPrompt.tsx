'use client';

import { MapPin } from 'lucide-react';
import { useUserLocationState } from '@/hooks/useUserCoords';

export default function LocationPermissionPrompt() {
  const { userCoords, isLocating, permissionState, requestLocation } = useUserLocationState();

  if (userCoords || permissionState === 'denied' || permissionState === 'unsupported') {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-6 z-[10000] px-4 sm:bottom-8">
      <div className="mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-primary-100 bg-white/95 p-4 shadow-xl shadow-primary-900/10 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <MapPin size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Enable your location</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Allow location access to see how far businesses are from you. Your browser may ask
              for permission.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={isLocating}
          className="shrink-0 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLocating ? 'Requesting…' : 'Allow location'}
        </button>
      </div>
    </div>
  );
}
