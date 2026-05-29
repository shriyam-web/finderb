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
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (code: string) => void;
  onEnd?: () => void;
  lang?: string;
}): VoiceRecognitionInstance | null {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = handlers.lang ?? 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: VoiceRecognitionEventLike) => {
    let finalText = '';
    let interimText = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interimText += transcript;
      }
    }

    const interim = (finalText + interimText).trim();
    if (interim && handlers.onInterim) {
      handlers.onInterim(interim);
    }
    if (finalText.trim()) {
      handlers.onFinal(finalText.trim());
    }
  };

  recognition.onerror = (event: VoiceRecognitionErrorEventLike) => {
    handlers.onError?.(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  return recognition;
}
