'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X } from 'lucide-react';
import { unverifiedContactMessage, type UnverifiedContactKind } from '@/lib/unverifiedContact';

export default function UnverifiedDetailDialog({
  kind,
  onClose,
}: {
  kind: UnverifiedContactKind | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!kind) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [kind, onClose]);

  if (!kind || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <ShieldAlert size={20} />
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-700">{unverifiedContactMessage(kind)}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-[#153551] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Okay
        </button>
      </div>
    </div>,
    document.body,
  );
}
