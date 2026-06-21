'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createVoiceRecognition,
  detachVoiceRecognition,
  getSpeechRecognitionCtor,
  microphoneErrorMessage,
  normalizeVoiceTranscript,
  requestMicrophoneAccess,
  type VoiceRecognitionInstance,
} from '@/lib/voiceSearch';

export type VoicePhase = 'speak-now' | 'listening' | 'preview' | 'searching';

const PREVIEW_MS = 2000;

export function useVoiceSearch(onSearch: (query: string) => void) {
  const [modalOpen, setModalOpen] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>('speak-now');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef(0);
  const recognitionRef = useRef<VoiceRecognitionInstance | null>(null);
  const transcriptRef = useRef('');
  const lockedRef = useRef(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalOpenRef = useRef(false);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  const clearPreviewTimer = useCallback(() => {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
  }, []);

  const stopEngine = useCallback((abort = false) => {
    const rec = recognitionRef.current;
    if (!rec) return;
    recognitionRef.current = null;
    detachVoiceRecognition(rec);
    try {
      if (abort) rec.abort();
      else rec.stop();
    } catch {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const closeVoiceSearch = useCallback(() => {
    sessionRef.current += 1;
    clearPreviewTimer();
    stopEngine(true);
    lockedRef.current = false;
    transcriptRef.current = '';
    setTranscript('');
    setPhase('speak-now');
    setError(null);
    modalOpenRef.current = false;
    setModalOpen(false);
  }, [clearPreviewTimer, stopEngine]);

  const beginPreview = useCallback(
    (session: number) => {
      if (session !== sessionRef.current || lockedRef.current || !modalOpenRef.current) return;

      const q = normalizeVoiceTranscript(transcriptRef.current);
      stopEngine(false);

      if (q.length < 2) {
        setError('No speech detected. Tap "Try again" and speak clearly.');
        setPhase('speak-now');
        return;
      }

      lockedRef.current = true;
      transcriptRef.current = q;
      setTranscript(q);
      setPhase('preview');
      setError(null);

      clearPreviewTimer();
      previewTimerRef.current = setTimeout(() => {
        previewTimerRef.current = null;
        if (session !== sessionRef.current || !modalOpenRef.current) return;
        setPhase('searching');
        onSearchRef.current(q);
        closeVoiceSearch();
      }, PREVIEW_MS);
    },
    [clearPreviewTimer, closeVoiceSearch, stopEngine]
  );

  const startListening = useCallback(
    (session: number) => {
      if (session !== sessionRef.current || !modalOpenRef.current) return;

      stopEngine(true);

      const recognition = createVoiceRecognition({
        lang: 'en-IN',
        continuous: false,
        onTranscript: (text) => {
          if (session !== sessionRef.current || lockedRef.current) return;
          const trimmed = normalizeVoiceTranscript(text);
          if (!trimmed) return;
          transcriptRef.current = trimmed;
          setTranscript(trimmed);
          setPhase('listening');
          setError(null);
        },
        onError: (code) => {
          if (session !== sessionRef.current) return;
          if (code === 'aborted') return;
          stopEngine(true);
          if (code === 'not-allowed') {
            setError(
              'Microphone blocked. Click the lock icon in your address bar and allow microphone access, then try again.'
            );
          } else if (code === 'no-speech') {
            setError('No speech detected. Tap "Try again" and speak clearly.');
          } else {
            setError('Could not hear you. Tap "Try again".');
          }
          setPhase('speak-now');
        },
        onEnd: () => {
          if (session !== sessionRef.current || lockedRef.current) return;
          recognitionRef.current = null;
          if (!modalOpenRef.current) return;
          beginPreview(session);
        },
      });

      if (!recognition) {
        setError('Voice search is unavailable in this browser.');
        setPhase('speak-now');
        return;
      }

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        if (session !== sessionRef.current) return;
        setPhase('speak-now');
        setError(null);
      };

      try {
        recognition.start();
      } catch {
        stopEngine(true);
        setError('Unable to start microphone. Tap "Try again".');
        setPhase('speak-now');
      }
    },
    [beginPreview, stopEngine]
  );

  const openVoiceSearch = useCallback(async () => {
    if (modalOpenRef.current) return;

    if (!getSpeechRecognitionCtor()) {
      alert('Voice search is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const mic = await requestMicrophoneAccess();
    if (!mic.ok) {
      sessionRef.current += 1;
      lockedRef.current = false;
      transcriptRef.current = '';
      setTranscript('');
      setError(microphoneErrorMessage(mic.reason));
      setPhase('speak-now');
      modalOpenRef.current = true;
      setModalOpen(true);
      return;
    }

    sessionRef.current += 1;
    const session = sessionRef.current;

    lockedRef.current = false;
    transcriptRef.current = '';
    setTranscript('');
    setError(null);
    setPhase('speak-now');
    modalOpenRef.current = true;
    setModalOpen(true);

    startListening(session);
  }, [startListening]);

  const retryVoiceSearch = useCallback(async () => {
    if (!modalOpenRef.current) return;

    const mic = await requestMicrophoneAccess();
    if (!mic.ok) {
      setError(microphoneErrorMessage(mic.reason));
      setPhase('speak-now');
      return;
    }

    lockedRef.current = false;
    transcriptRef.current = '';
    setTranscript('');
    setError(null);
    setPhase('speak-now');
    startListening(sessionRef.current);
  }, [startListening]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      clearPreviewTimer();
      stopEngine(true);
    };
  }, [clearPreviewTimer, stopEngine]);

  return {
    voiceActive: modalOpen,
    voicePhase: phase,
    voiceTranscript: transcript,
    voiceError: error,
    openVoiceSearch,
    closeVoiceSearch,
    retryVoiceSearch,
  };
}
