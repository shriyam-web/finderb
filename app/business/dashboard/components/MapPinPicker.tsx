'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { geocodePlaceQuery } from '@/app/actions/location';

type Coords = { lat: number; lng: number };

type MapPinPickerProps = {
  initial: Coords | null;
  /** Used to centre the map when there is no saved pin yet. */
  placeQuery: string;
  busy: boolean;
  onConfirm: (coords: Coords) => void;
  onCancel: () => void;
};

const INDIA_CENTER: Coords = { lat: 22.9734, lng: 78.6569 };

const PIN_HTML =
  '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#4f46e5;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 10px rgba(15,23,42,.35)"></div>';

export default function MapPinPicker({ initial, placeQuery, busy, onConfirm, onCancel }: MapPinPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [pin, setPin] = useState<Coords | null>(initial);

  useEffect(() => {
    let cancelled = false;

    void import('leaflet').then(async (L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const icon = L.divIcon({ html: PIN_HTML, className: '', iconSize: [28, 28], iconAnchor: [14, 28] });
      const map = L.map(containerRef.current, {
        center: initial ?? INDIA_CENTER,
        zoom: initial ? 16 : 5,
        scrollWheelZoom: true,
      });
      mapRef.current = map;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const placeMarker = (coords: Coords) => {
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        } else {
          const marker = L.marker(coords, { icon, draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const point = marker.getLatLng();
            setPin({ lat: point.lat, lng: point.lng });
          });
          markerRef.current = marker;
        }
        setPin(coords);
      };

      if (initial) placeMarker(initial);
      map.on('click', (event) => placeMarker({ lat: event.latlng.lat, lng: event.latlng.lng }));

      if (!initial && placeQuery.trim()) {
        const found = await geocodePlaceQuery(placeQuery);
        if (!cancelled && found && mapRef.current) {
          mapRef.current.setView([found.latitude, found.longitude], 14);
        }
      }
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map is created once per open; later prop changes must not rebuild it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
      <p className="text-xs leading-relaxed text-slate-600">
        Tap the map to drop a pin on your business, then drag it to the exact spot.
      </p>
      <div
        ref={containerRef}
        className="relative z-0 h-72 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
      />
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
          {busy ? 'Checking…' : pin ? 'Use this pin' : 'Tap the map to drop a pin'}
        </button>
      </div>
    </div>
  );
}
