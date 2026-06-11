'use client';

import { useEffect, useRef, useState } from 'react';
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineMapPin,
} from 'react-icons/hi2';
import { lookupPlaceNameFromCoordinates, resolveGoogleMapsLocation } from '@/app/actions/location';
import { buildGoogleMapsUrl } from '@/lib/googleMapsLocation';

type GoogleMapsLocationEditorProps = {
  googleMapsUrl: string;
  latitude?: number | null;
  longitude?: number | null;
  onResolved: (values: {
    googleMapsUrl: string;
    latitude: number;
    longitude: number;
  }) => void;
};

const STEPS = [
  'Open Google Maps, find your shop, and drop the pin on your exact location.',
  'Tap Share → Copy link.',
  'Paste that link below and click Verify.',
];

export default function GoogleMapsLocationEditor({
  googleMapsUrl,
  latitude,
  longitude,
  onResolved,
}: GoogleMapsLocationEditorProps) {
  const [input, setInput] = useState(googleMapsUrl);
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'error'>('idle');
  const [error, setError] = useState('');
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [lastVerifiedInput, setLastVerifiedInput] = useState('');
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null && (latitude !== 0 || longitude !== 0)
      ? { lat: latitude, lng: longitude }
      : null
  );

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

  const handleVerify = async () => {
    setStatus('loading');
    setError('');

    const result = await resolveGoogleMapsLocation(input);

    if (!result.success) {
      setStatus('error');
      setError(result.error);
      setResolvedCoords(null);
      setPlaceName(null);
      pendingScrollRef.current = true;
      return;
    }

    const verifiedInput = result.normalizedUrl;
    setStatus('valid');
    setResolvedCoords({ lat: result.latitude, lng: result.longitude });
    setPlaceName(result.placeName);
    setInput(verifiedInput);
    setLastVerifiedInput(verifiedInput.trim());
    onResolved({
      googleMapsUrl: verifiedInput,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    pendingScrollRef.current = true;
  };

  const trimmedInput = input.trim();
  const isVerifiedUnchanged =
    status === 'valid' && trimmedInput !== '' && trimmedInput === lastVerifiedInput;
  const canVerify = Boolean(trimmedInput) && status !== 'loading' && !isVerifiedUnchanged;

  const previewUrl = resolvedCoords
    ? buildGoogleMapsUrl(resolvedCoords.lat, resolvedCoords.lng)
    : null;

  const embedUrl = resolvedCoords
    ? `https://maps.google.com/maps?q=${resolvedCoords.lat},${resolvedCoords.lng}&z=16&output=embed`
    : null;

  const showResult = (status === 'valid' && resolvedCoords) || (status === 'error' && error);

  return (
    <div className="space-y-6">
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
          {status === 'loading'
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
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-emerald-200/80 bg-white">
                <iframe
                  title="Map preview"
                  src={embedUrl}
                  className="aspect-video w-full min-h-[160px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
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
                <p className="text-sm font-semibold text-red-800">Link not accepted</p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
