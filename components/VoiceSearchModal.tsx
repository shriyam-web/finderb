'use client';

import { Mic } from 'lucide-react';
import type { VoicePhase } from '@/hooks/useVoiceSearch';

type VoiceSearchModalProps = {
  open: boolean;
  phase: VoicePhase;
  transcript: string;
  error: string | null;
  onCancel: () => void;
  onRetry: () => void;
};

export default function VoiceSearchModal({
  open,
  phase,
  transcript,
  error,
  onCancel,
  onRetry,
}: VoiceSearchModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-black/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-search-title"
    >
      <div className="mx-4 flex w-full max-w-sm transform flex-col items-center space-y-6 rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div
            className={`absolute inset-0 scale-150 animate-ping rounded-full ${
              phase === 'preview' || phase === 'searching' ? 'bg-secondary/20' : 'bg-primary/20'
            }`}
          />
          <div className="relative rounded-full bg-primary p-6 text-white shadow-lg">
            <Mic
              size={40}
              className={phase === 'speak-now' || phase === 'listening' ? 'animate-bounce' : ''}
            />
          </div>
        </div>

        <div className="min-h-[88px] space-y-3 text-center">
          <h3 id="voice-search-title" className="text-xl font-bold text-gray-900">
            {phase === 'speak-now' && 'Speak now'}
            {phase === 'listening' && 'Listening to you..'}
            {phase === 'preview' && 'You said'}
            {phase === 'searching' && 'Searching...'}
          </h3>

          {phase === 'listening' && transcript ? (
            <p className="text-sm font-medium leading-relaxed text-gray-600">
              &ldquo;{transcript}&rdquo;
            </p>
          ) : null}

          {(phase === 'preview' || phase === 'searching') && transcript ? (
            <p className="text-base font-bold leading-relaxed text-primary">
              &ldquo;{transcript}&rdquo;
            </p>
          ) : null}

          {phase === 'preview' ? (
            <p className="text-xs font-medium text-gray-400">Searching in a moment...</p>
          ) : null}

          {phase === 'speak-now' && !error ? (
            <p className="text-sm text-gray-400">Say what you&apos;re looking for</p>
          ) : null}

          {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
        </div>

        {phase !== 'searching' ? (
          <div className="flex w-full flex-col gap-2">
            {error ? (
              <button
                type="button"
                onClick={onRetry}
                className="w-full rounded-2xl bg-primary px-6 py-3 font-bold text-white transition-colors hover:bg-primary/90 active:scale-95"
              >
                Try again
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCancel}
              className="w-full rounded-2xl bg-gray-100 px-6 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200 active:scale-95"
            >
              Cancel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
