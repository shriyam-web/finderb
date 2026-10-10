'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2, Crosshair, Link2, Map as MapIcon, MapPin, X } from 'lucide-react';
import { resolveGoogleMapsLocation, validateMapPinAgainstAddress } from '@/app/actions/location';
import { mapEmbedSrc } from '@/lib/businessContact';

const GoogleMapPinPicker = dynamic(() => import('@/components/maps/GoogleMapPinPicker'), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100" />,
});

export type RegisterPin = { latitude: number; longitude: number };

type RegisterMapPinProps = {
  city: string;
  state: string;
  country: string;
  pin: RegisterPin | null;
  onChange: (pin: RegisterPin | null) => void;
};

function readCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });
}

export default function RegisterMapPin({ city, state, country, pin, onChange }: RegisterMapPinProps) {
  const [busy, setBusy] = useState<'gps' | 'link' | 'map' | null>(null);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const ready = Boolean(city.trim());

  const acceptPin = async (latitude: number, longitude: number) => {
    const check = await validateMapPinAgainstAddress(latitude, longitude, { city, state, country });
    if (!check.ok) {
      onChange(null);
      setError(check.error);
      return false;
    }
    setError('');
    onChange({ latitude, longitude });
    return true;
  };

  const pinCurrentLocation = async () => {
    if (!ready || busy) return;
    if (!('geolocation' in navigator)) {
      setError('This browser cannot share your location. Search on Google Maps or paste a link instead.');
      return;
    }
    setError('');
    setBusy('gps');
    try {
      const position = await readCurrentPosition();
      await acceptPin(position.coords.latitude, position.coords.longitude);
    } catch (reason) {
      const denied = (reason as GeolocationPositionError)?.code === 1;
      setError(
        denied
          ? 'Location access was blocked. Allow it in your browser, or search on Google Maps.'
          : 'Could not read your current location. Search on Google Maps or paste a link instead.',
      );
    } finally {
      setBusy(null);
    }
  };

  const pinFromLink = async () => {
    if (!ready || busy || !link.trim()) return;
    setError('');
    setBusy('link');
    try {
      const resolved = await resolveGoogleMapsLocation(link);
      if (!resolved.success) {
        setError(resolved.error);
        return;
      }
      await acceptPin(resolved.latitude, resolved.longitude);
    } finally {
      setBusy(null);
    }
  };

  const pinFromMap = async (coords: { lat: number; lng: number }) => {
    if (busy) return;
    setError('');
    setBusy('map');
    try {
      if (await acceptPin(coords.lat, coords.lng)) setPickerOpen(false);
    } finally {
      setBusy(null);
    }
  };

  const clearPin = () => {
    onChange(null);
    setError('');
    setLink('');
  };

  const embedUrl = pin ? mapEmbedSrc({ latitude: pin.latitude, longitude: pin.longitude }) : undefined;
  const placeQuery = [city, state, country].map((part) => part.trim()).filter(Boolean).join(', ');

  return (
    <div className="rounded-2xl border-2 border-[#dfe6ee] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#153551]">
          <MapPin size={16} />
          Business location on map
        </p>
        <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#64748b]">
          Optional
        </span>
      </div>

      {pin ? (
        <div className="mt-3 space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={14} />
            Pin is inside {city}. It will be saved with your listing.
          </p>
          {embedUrl ? (
            <iframe
              title="Business location preview"
              src={embedUrl}
              className="aspect-video min-h-[160px] w-full rounded-xl border border-[#e8edf2]"
              loading="lazy"
            />
          ) : null}
          <button
            type="button"
            onClick={clearPin}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3d4f63] hover:text-[#153551]"
          >
            <X size={14} />
            Clear pin
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-[#64748b]">
            {ready
              ? `Add the exact spot so customers can find you. The pin has to sit inside ${city}.`
              : 'Select a city first. The written address is enough if you skip this.'}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => void pinCurrentLocation()}
              disabled={!ready || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#cfe0f1] bg-[#f3f8fd] px-3 py-2.5 text-sm font-semibold text-[#215481] transition-colors hover:bg-[#e7f1fb] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Crosshair size={16} />
              {busy === 'gps' ? 'Checking…' : 'Current location'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPickerOpen((open) => !open);
                setLinkOpen(false);
              }}
              disabled={!ready || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#e8edf2] bg-white px-3 py-2.5 text-sm font-semibold text-[#3d4f63] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MapIcon size={16} />
              Find on Google Maps
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkOpen((open) => !open);
                setPickerOpen(false);
              }}
              disabled={!ready || busy !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#e8edf2] bg-white px-3 py-2.5 text-sm font-semibold text-[#3d4f63] transition-colors hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Link2 size={16} />
              Paste Maps link
            </button>
          </div>
          {pickerOpen && ready ? (
            <GoogleMapPinPicker
              initial={null}
              placeQuery={placeQuery}
              near={{ city, state }}
              busy={busy === 'map'}
              onConfirm={(coords) => void pinFromMap(coords)}
              onCancel={() => setPickerOpen(false)}
            />
          ) : null}
          {linkOpen && ready ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  setError('');
                }}
                placeholder="https://maps.app.goo.gl/..."
                className="min-w-0 flex-1 rounded-xl border-2 border-[#dfe6ee] bg-white px-3.5 py-2.5 text-sm text-[#153551] outline-none focus:border-[#215481]"
              />
              <button
                type="button"
                onClick={() => void pinFromLink()}
                disabled={!link.trim() || busy !== null}
                className="rounded-xl bg-[#153551] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#215481] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'link' ? 'Checking…' : 'Use link'}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {error ? <p className="mt-3 text-xs leading-relaxed text-red-600">{error}</p> : null}
    </div>
  );
}
