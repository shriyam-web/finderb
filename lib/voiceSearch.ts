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

/** Clean up duplicated words from flaky speech-to-text (e.g. "electricianelectrician"). */
export function normalizeVoiceTranscript(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';

  const words = collapsed.split(' ');
  const dedupedWords = words.map((word) => dedupeGluedToken(word)).filter(Boolean);

  const out: string[] = [];
  for (const word of dedupedWords) {
    const prev = out[out.length - 1];
    if (!prev || prev.toLowerCase() !== word.toLowerCase()) {
      out.push(word);
    }
  }

  return out.join(' ');
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

  /** Confirmed speech — only append each result index once. */
  let sessionFinal = '';
  const finalizedIndices = new Set<number>();

  recognition.onresult = (event: VoiceRecognitionEventLike) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const piece = result?.[0]?.transcript ?? '';
      if (!piece) continue;

      if (result.isFinal) {
        if (!finalizedIndices.has(i)) {
          sessionFinal += piece;
          finalizedIndices.add(i);
        }
      } else {
        interim += piece;
      }
    }

    const display = normalizeVoiceTranscript(sessionFinal + interim);
    if (!display || !handlers.onTranscript) return;
    handlers.onTranscript(display, interim.trim().length === 0);
  };

  recognition.onerror = (event: VoiceRecognitionErrorEventLike) => {
    handlers.onError?.(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  return recognition;
}
