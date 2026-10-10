'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { Crosshair, Map as MapIcon } from 'lucide-react';
import { lookupPlaceNameFromCoordinates, resolveGoogleMapsLocation, validateMapPinAgainstAddress } from '@/app/actions/location';
import { mapEmbedSrc } from '@/lib/businessContact';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLocation';
import type { ManualAddress } from '@/lib/locationMatch';
import { locationTokensMatch } from '@/lib/locationMatch';

const GoogleMapPinPicker = dynamic(() => import('@/components/maps/GoogleMapPinPicker'), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-slate-100" />,
});

type PickedLocation = {
  latitude: number;
  longitude: number;
  placeName: string | null;
  url: string;
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

type GoogleMapsLocationEditorProps = {
  googleMapsUrl: string;
  latitude?: number | null;
  longitude?: number | null;
  addressContext?: ManualAddress;
  onResolved: (values: {
    googleMapsUrl: string;
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
    addressCorrected: boolean;
  }) => void;
};

const STEPS = [
  'Open Google Maps, find your business, and drop the pin on your exact location.',
  'Tap Share → Copy link.',
  'Paste that link below and click Verify.',
];

export default function GoogleMapsLocationEditor({
  googleMapsUrl,
  latitude,
  longitude,
  addressContext,
  onResolved,
}: GoogleMapsLocationEditorProps) {
  const [input, setInput] = useState(googleMapsUrl);
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'error'>('idle');
  const [error, setError] = useState('');
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [addressCorrectionNote, setAddressCorrectionNote] = useState('');
  const [lastVerifiedInput, setLastVerifiedInput] = useState('');
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null && (latitude !== 0 || longitude !== 0)
      ? { lat: latitude, lng: longitude }
      : null
  );
  const [busySource, setBusySource] = useState<'link' | 'gps' | 'map' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  const scrollToResult = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  };

  useEffect(() => {
    if (!pendingScrollRef.current) return;
    if (status !== 'valid' && status !== 'error') return;

    pendingScrollRef.current = false;
    scrollToResult();
  }, [status, error, placeName, resolvedCoords]);

  useEffect(() => {
    setInput(googleMapsUrl);

    const hasCoords =
      latitude != null && longitude != null && (latitude !== 0 || longitude !== 0);

    if (!hasCoords) {
      setResolvedCoords(null);
      setPlaceName(null);
      setLastVerifiedInput('');
      setStatus('idle');
      return;
    }

    setResolvedCoords({ lat: latitude, lng: longitude });
    setStatus('valid');
    setLastVerifiedInput(googleMapsUrl.trim());

    lookupPlaceNameFromCoordinates(latitude, longitude, googleMapsUrl).then((result) => {
      if (result.success && result.placeName) {
        setPlaceName(result.placeName);
      }
    });
  }, [googleMapsUrl, latitude, longitude]);

  const showError = (message: string) => {
    setStatus('error');
    setError(message);
    setResolvedCoords(null);
    setPlaceName(null);
    setAddressCorrectionNote('');
    pendingScrollRef.current = true;
  };

  /** Shared by the link, current-location, and map-pin paths. Returns false when the pin is unusable. */
  const acceptLocation = async (picked: PickedLocation): Promise<boolean> => {
    const addressMatch = await validateMapPinAgainstAddress(
      picked.latitude,
      picked.longitude,
      addressContext ?? {},
    );

    const resolved = addressMatch.resolved;
    if (!resolved.city && !resolved.state && !resolved.country) {
      showError(addressMatch.ok === false ? addressMatch.error : 'Could not read city/state from this pin.');
      return false;
    }

    const nextCity = resolved.city ?? '';
    const nextState = resolved.state ?? '';
    const nextCountry = resolved.country ?? '';
    const manualCity = addressContext?.city?.trim() ?? '';
    const manualState = addressContext?.state?.trim() ?? '';
    const manualCountry = addressContext?.country?.trim() ?? '';
    const addressCorrected = Boolean(
      !addressMatch.ok ||
        (manualCity && nextCity && !locationTokensMatch(manualCity, nextCity)) ||
        (manualState && nextState && !locationTokensMatch(manualState, nextState)) ||
        (manualCountry && nextCountry && !locationTokensMatch(manualCountry, nextCountry)),
    );

    const verifiedInput = picked.url;
    setStatus('valid');
    setError('');
    setResolvedCoords({ lat: picked.latitude, lng: picked.longitude });
    setPlaceName(picked.placeName);
    setInput(verifiedInput);
    setLastVerifiedInput(verifiedInput.trim());
    setAddressCorrectionNote(
      addressCorrected
        ? `City, state, and country were set from your map pin: ${[nextCity, nextState, nextCountry].filter(Boolean).join(', ')}.`
        : nextCity || nextState || nextCountry
          ? `City, state, and country will be saved as ${[nextCity, nextState, nextCountry].filter(Boolean).join(', ')}.`
          : '',
    );
    onResolved({
      googleMapsUrl: verifiedInput,
      latitude: picked.latitude,
      longitude: picked.longitude,
      city: nextCity,
      state: nextState,
      country: nextCountry,
      addressCorrected,
    });
    pendingScrollRef.current = true;
    return true;
  };

  const handleVerify = async () => {
    setStatus('loading');
    setError('');
    setBusySource('link');
    try {
      const result = await resolveGoogleMapsLocation(input);
      if (!result.success) {
        showError(result.error);
        return;
      }
      await acceptLocation({
        latitude: result.latitude,
        longitude: result.longitude,
        placeName: result.placeName,
        url: result.normalizedUrl,
      });
    } finally {
      setBusySource(null);
    }
  };

  const handleCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      showError('This browser cannot share your location. Set the pin on the map or paste a Google Maps link.');
      return;
    }
    setPickerOpen(false);
    setStatus('loading');
    setError('');
    setBusySource('gps');
    try {
      const position = await readCurrentPosition();
      const { latitude: lat, longitude: lng } = position.coords;
      await acceptLocation({
        latitude: lat,
        longitude: lng,
        placeName: null,
        url: buildGoogleMapsUrl(lat, lng),
      });
    } catch (reason) {
      const denied = (reason as GeolocationPositionError)?.code === 1;
      showError(
        denied
          ? 'Location access is blocked. Allow it in your browser settings, or set the pin on the map.'
          : 'Could not read your current location. Set the pin on the map or paste a Google Maps link.',
      );
    } finally {
      setBusySource(null);
    }
  };

  const handleMapPick = async ({ lat, lng }: { lat: number; lng: number }) => {
    setStatus('loading');
    setError('');
    setBusySource('map');
    try {
      const accepted = await acceptLocation({
        latitude: lat,
        longitude: lng,
        placeName: null,
        url: buildGoogleMapsUrl(lat, lng),
      });
      if (accepted) setPickerOpen(false);
    } finally {
      setBusySource(null);
    }
  };

  const trimmedInput = input.trim();
  const isVerifiedUnchanged =
    status === 'valid' && trimmedInput !== '' && trimmedInput === lastVerifiedInput;
  const canVerify = Boolean(trimmedInput) && status !== 'loading' && !isVerifiedUnchanged;

  const previewUrl = resolvedCoords
    ? buildGoogleMapsUrl(resolvedCoords.lat, resolvedCoords.lng)
    : null;

  const embedUrl = resolvedCoords
    ? mapEmbedSrc({ latitude: resolvedCoords.lat, longitude: resolvedCoords.lng })
    : null;

  const showResult = (status === 'valid' && resolvedCoords) || (status === 'error' && error);

  const placeQuery = [addressContext?.city, addressContext?.state, addressContext?.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void handleCurrentLocation()}
            disabled={busySource !== null}
            className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Crosshair size={16} />
            {busySource === 'gps' ? 'Finding you…' : 'Use current location'}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen((open) => !open)}
            disabled={busySource !== null && busySource !== 'map'}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              pickerOpen
                ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapIcon size={16} />
            Set location on map
          </button>
        </div>
        {pickerOpen && (
          <GoogleMapPinPicker
            initial={resolvedCoords}
            placeQuery={placeQuery}
            near={{ city: addressContext?.city, state: addressContext?.state }}
            busy={busySource === 'map'}
            onConfirm={(coords) => void handleMapPick(coords)}
            onCancel={() => setPickerOpen(false)}
          />
        )}
      </div>

      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or paste a Google Maps link
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <ol className="space-y-2.5">
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      {addressContext?.city?.trim() && (
        <p className="text-xs leading-relaxed text-slate-500">
          Your written address says{' '}
          <span className="font-medium text-slate-700">
            {[addressContext.city, addressContext.state, addressContext.country].filter(Boolean).join(', ')}
          </span>
          . If it differs from the pin, we&apos;ll update city/state/country to match the map.
        </p>
      )}
      {!addressContext?.city?.trim() && (
        <p className="text-xs leading-relaxed text-slate-500">
          After you verify, we&apos;ll auto-fill City, State, and Country from your map pin.
        </p>
      )}

      <div className="space-y-3">
        <label htmlFor="google-maps-link" className="block text-sm font-semibold text-slate-900">
          Paste your Google Maps link
        </label>
        <textarea
          id="google-maps-link"
          value={input}
          onChange={(e) => {
            const nextValue = e.target.value;
            setInput(nextValue);
            setError('');
            setAddressCorrectionNote('');

            if (nextValue.trim() !== lastVerifiedInput) {
              setStatus('idle');
              setResolvedCoords(null);
              setPlaceName(null);
            }
          }}
          rows={2}
          placeholder="https://maps.app.goo.gl/..."
          className="w-full resize-none break-all rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <HiOutlineMapPin size={16} />
          {busySource === 'link'
            ? 'Checking…'
            : isVerifiedUnchanged
              ? 'Verified ✓'
              : 'Verify'}
        </button>
      </div>

      {showResult && (
        <div ref={resultRef} className="scroll-mt-4">
          {status === 'valid' && resolvedCoords && previewUrl && embedUrl && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-2.5">
                <HiOutlineCheckCircle size={20} className="shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-900">
                    {placeName || 'Location verified'}
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Looks good — click <strong>Save location</strong> below to keep it.
                  </p>
                  {addressCorrectionNote && (
                    <p className="mt-2 text-xs leading-relaxed text-emerald-800">{addressCorrectionNote}</p>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-emerald-200/80 bg-white">
                {embedUrl ? (
                  <iframe
                    title="Map preview"
                    src={embedUrl}
                    className="aspect-video w-full min-h-[160px] border-0"
                    loading="lazy"
                    referrerPolicy="origin-when-cross-origin"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex aspect-video min-h-[160px] items-center justify-center bg-slate-50 px-4 text-center text-xs text-slate-500">
                    Add <code className="mx-1 rounded bg-slate-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{' '}
                    with Maps Embed API enabled to preview the map here.
                  </div>
                )}
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-medium text-emerald-800 underline underline-offset-2"
              >
                Open in Google Maps
              </a>
            </div>
          )}

          {status === 'error' && error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4">
              <HiOutlineExclamationCircle size={20} className="shrink-0 text-red-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">Location not accepted</p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
