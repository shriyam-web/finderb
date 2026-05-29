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

/** Remove glued duplicate phrases (e.g. "car repaircar repair" → "car repair"). */
function dedupeGluedPhrases(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length < 4) return trimmed;

  for (let len = Math.floor(trimmed.length / 2); len >= 2; len--) {
    const first = trimmed.slice(0, len).trimEnd();
    const second = trimmed.slice(len).trimStart();
    if (!first || !second) continue;
    if (first.toLowerCase() === second.toLowerCase()) {
      return first;
    }
  }

  for (let size = 1; size <= Math.floor(trimmed.length / 2); size++) {
    if (trimmed.length % size !== 0) continue;
    const chunk = trimmed.slice(0, size);
    if (chunk.repeat(trimmed.length / size) === trimmed) {
      return chunk.trim();
    }
  }

  return trimmed;
}

function dedupeGluedToken(token: string): string {
  const word = token.trim();
  if (word.length < 4) return word;

  for (let size = 1; size <= Math.floor(word.length / 2); size++) {
    if (word.length % size !== 0) continue;
    const chunk = word.slice(0, size);
    if (chunk.repeat(word.length / size) === word) {
      return chunk;
    }
  }

  return word;
}

/** Clean up duplicated words/phrases from flaky speech-to-text. */
export function normalizeVoiceTranscript(text: string): string {
  const deGlued = dedupeGluedPhrases(text.replace(/\s+/g, ' ').trim());
  if (!deGlued) return '';

  const words = deGlued.split(' ');
  const dedupedWords = words.map((word) => dedupeGluedToken(word)).filter(Boolean);

  const out: string[] = [];
  for (const word of dedupedWords) {
    const prev = out[out.length - 1];
    if (!prev || prev.toLowerCase() !== word.toLowerCase()) {
      out.push(word);
    }
  }

  let phrase = out.join(' ');

  // Drop repeated trailing phrase: "electrician near me electrician near me"
  const parts = phrase.split(' ');
  if (parts.length >= 4 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    const firstHalf = parts.slice(0, half).join(' ').toLowerCase();
    const secondHalf = parts.slice(half).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      phrase = parts.slice(0, half).join(' ');
    }
  }

  return phrase.trim();
}

/** Build one transcript string from the browser result list (no cross-event accumulation). */
export function transcriptFromResults(
  results: VoiceRecognitionEventLike['results']
): string {
  let raw = '';
  for (let i = 0; i < results.length; i++) {
    raw += results[i]?.[0]?.transcript ?? '';
  }
  return normalizeVoiceTranscript(raw);
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
    const display = transcriptFromResults(event.results);
    if (!display || !handlers.onTranscript) return;

    let allFinal = true;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (!event.results[i]?.isFinal) {
        allFinal = false;
        break;
      }
    }
    handlers.onTranscript(display, allFinal);
  };

  recognition.onerror = (event: VoiceRecognitionErrorEventLike) => {
    handlers.onError?.(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  return recognition;
}

/** Detach handlers so late events cannot fire after abort/stop. */
export function detachVoiceRecognition(recognition: VoiceRecognitionInstance): void {
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
  recognition.onstart = null;
}
