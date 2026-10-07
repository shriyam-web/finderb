'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const VIEW = 280;
const OUTPUT = 512;
const MAX_ZOOM = 4;

type Offset = { x: number; y: number };

function clampOffset(offset: Offset, width: number, height: number): Offset {
  const maxX = Math.max(0, (width - VIEW) / 2);
  const maxY = Math.max(0, (height - VIEW) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export default function AvatarCropModal({
  file,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  file: File;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: (dataUri: string) => void;
}) {
  const [src, setSrc] = useState('');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const drag = useRef<{ pointerId: number; startX: number; startY: number; from: Offset } | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => setSrc(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setLoadError('This photo could not be opened. Choose a JPG, PNG or WebP photo.');
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const baseScale = image ? Math.max(VIEW / image.naturalWidth, VIEW / image.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const width = image ? image.naturalWidth * scale : VIEW;
  const height = image ? image.naturalHeight * scale : VIEW;

  const applyZoom = (next: number) => {
    const value = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(value);
    if (image) {
      const s = baseScale * value;
      setOffset((current) => clampOffset(current, image.naturalWidth * s, image.naturalHeight * s));
    }
  };

  const save = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const context = canvas.getContext('2d');
    if (!context) return;
    const left = VIEW / 2 - width / 2 + offset.x;
    const top = VIEW / 2 - height / 2 + offset.y;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, OUTPUT, OUTPUT);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, -left / scale, -top / scale, VIEW / scale, VIEW / scale, 0, 0, OUTPUT, OUTPUT);
    onConfirm(canvas.toDataURL('image/jpeg', 0.88));
  };

  return (
    <div
      className="fixed inset-0 z-[10100] flex items-center justify-center bg-zinc-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile photo"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Crop your photo</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Drag to move, zoom to fit your face in the circle.</p>

        <div
          className="relative mx-auto mt-4 cursor-grab touch-none select-none overflow-hidden rounded-xl bg-zinc-100 active:cursor-grabbing"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={(event) => {
            if (!image || busy) return;
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              // Capture is best-effort; dragging still works inside the frame.
            }
            drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, from: offset };
          }}
          onPointerMove={(event) => {
            const state = drag.current;
            if (!state || state.pointerId !== event.pointerId) return;
            setOffset(
              clampOffset(
                { x: state.from.x + event.clientX - state.startX, y: state.from.y + event.clientY - state.startY },
                width,
                height,
              ),
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
          onWheel={(event) => applyZoom(zoom - event.deltaY * 0.002)}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Selected photo"
              draggable={false}
              onLoad={(event) => {
                setImage(event.currentTarget);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              onError={() => setLoadError('This photo could not be opened. Choose a JPG, PNG or WebP photo.')}
              className="pointer-events-none absolute max-w-none"
              style={{
                width,
                height,
                left: VIEW / 2 - width / 2 + offset.x,
                top: VIEW / 2 - height / 2 + offset.y,
                visibility: image ? 'visible' : 'hidden',
              }}
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 999px rgba(9, 9, 11, 0.45)' }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.25)}
            disabled={!image || busy}
            aria-label="Zoom out"
            className="text-zinc-500 hover:text-zinc-900 disabled:opacity-40"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(event) => applyZoom(Number(event.target.value))}
            disabled={!image || busy}
            aria-label="Zoom"
            className="h-1 flex-1 cursor-pointer accent-zinc-900"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.25)}
            disabled={!image || busy}
            aria-label="Zoom in"
            className="text-zinc-500 hover:text-zinc-900 disabled:opacity-40"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {loadError || error ? <p className="mt-3 text-xs text-red-600">{loadError || error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!image || busy}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
