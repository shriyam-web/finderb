'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { geocodePlaceQuery, searchGooglePlaces, type GooglePlaceResult } from '@/app/actions/location';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';

export type PickerCoords = { lat: number; lng: number };

type GoogleMapPinPickerProps = {
  initial: PickerCoords | null;
  /** Used to centre the map when there is no saved pin yet. */
  placeQuery: string;
  /** Search results are biased towards this city/state. */
  near?: { city?: string | null; state?: string | null };
  busy: boolean;
  confirmLabel?: string;
  onConfirm: (coords: PickerCoords) => void;
  onCancel: () => void;
};

const INDIA_CENTER: PickerCoords = { lat: 22.9734, lng: 78.6569 };

export default function GoogleMapPinPicker({
  initial,
  placeQuery,
  near,
  busy,
  confirmLabel = 'Use this pin',
  onConfirm,
  onCancel,
}: GoogleMapPinPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [pin, setPin] = useState<PickerCoords | null>(initial);
  const [mapError, setMapError] = useState('');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState<GooglePlaceResult[]>([]);

  const placeMarker = (coords: PickerCoords, zoom?: number) => {
    const map = mapRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setPosition(coords);
    } else {
      const marker = new google.maps.Marker({ position: coords, map, draggable: true });
      marker.addListener('dragend', () => {
        const point = marker.getPosition();
        if (point) setPin({ lat: point.lat(), lng: point.lng() });
      });
      markerRef.current = marker;
    }
    map.panTo(coords);
    if (zoom) map.setZoom(zoom);
    setPin(coords);
  };

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(async (maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new maps.Map(containerRef.current, {
          center: initial ?? INDIA_CENTER,
          zoom: initial ? 17 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        mapRef.current = map;
        if (initial) placeMarker(initial);
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) placeMarker({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        if (!initial && placeQuery.trim()) {
          const found = await geocodePlaceQuery(placeQuery);
          if (!cancelled && found && mapRef.current && !markerRef.current) {
            mapRef.current.setCenter({ lat: found.latitude, lng: found.longitude });
            mapRef.current.setZoom(14);
          }
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setMapError(error.message);
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
    // The map is created once per open; later prop changes must not rebuild it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSearch = async () => {
    if (searching || query.trim().length < 2) return;
    setSearching(true);
    setSearchError('');
    try {
      const found = await searchGooglePlaces(query, near);
      if (!found.success) {
        setResults([]);
        setSearchError(found.error);
        return;
      }
      setResults(found.places);
      if (!found.places.length) setSearchError('No match on Google Maps. Try the name with your area.');
    } finally {
      setSearching(false);
    }
  };

  const choosePlace = (place: GooglePlaceResult) => {
    placeMarker({ lat: place.latitude, lng: place.longitude }, 18);
    setResults([]);
    setQuery(place.name);
  };

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void runSearch();
                }
              }}
              placeholder="Search your business on Google Maps"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void runSearch()}
            disabled={searching || query.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>
        {results.length ? (
          <ul className="max-h-52 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {results.map((place) => (
              <li key={`${place.latitude},${place.longitude},${place.name}`}>
                <button
                  type="button"
                  onClick={() => choosePlace(place)}
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-indigo-50"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-indigo-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{place.name}</span>
                    {place.address ? (
                      <span className="block truncate text-xs text-slate-500">{place.address}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {searchError ? <p className="text-xs text-red-600">{searchError}</p> : null}
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        Pick a search result or tap the map to drop a pin, then drag it to the exact spot.
      </p>
      {mapError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{mapError}</p>
      ) : (
        <div
          ref={containerRef}
          className="relative z-0 h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => pin && onConfirm(pin)}
          disabled={!pin || busy}
          className="flex-[2] rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Checking…' : pin ? confirmLabel : 'Tap the map to drop a pin'}
        </button>
      </div>
    </div>
  );
}
