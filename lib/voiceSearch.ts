/** Minimal Web Speech API types (not in all TS lib.dom builds). */

export interface VoiceRecognitionResultItem {
  transcript: string;
}

export interface VoiceRecognitionResultList {
  isFinal: boolean;
  length: number;
  [index: number]: VoiceRecognitionResultItem;
}

export interface VoiceRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: VoiceRecognitionResultList;
  };
}

export interface VoiceRecognitionErrorEventLike {
  error: string;
}

export interface VoiceRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: VoiceRecognitionEventLike) => void) | null;
  onerror: ((event: VoiceRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type VoiceRecognitionCtor = new () => VoiceRecognitionInstance;

export function getSpeechRecognitionCtor(): VoiceRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    webkitSpeechRecognition?: VoiceRecognitionCtor;
    SpeechRecognition?: VoiceRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function createVoiceRecognition(handlers: {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (code: string) => void;
  onEnd?: () => void;
  lang?: string;
  /** Keep mic open until user taps stop (recommended for full sentences). */
  continuous?: boolean;
}): VoiceRecognitionInstance | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = handlers.lang ?? 'en-IN';
  recognition.continuous = handlers.continuous ?? true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: VoiceRecognitionEventLike) => {
    let fullText = '';
    let hasFinal = false;

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const piece = result?.[0]?.transcript ?? '';
      if (!piece) continue;
      fullText += piece;
      if (result.isFinal) {
        hasFinal = true;
      }
    }

    const trimmed = fullText.trim();
    if (!trimmed || !handlers.onTranscript) return;
    handlers.onTranscript(trimmed, hasFinal);
  };

  recognition.onerror = (event: VoiceRecognitionErrorEventLike) => {
    handlers.onError?.(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  return recognition;
}
