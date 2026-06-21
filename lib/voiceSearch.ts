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

export type MicrophoneAccessFailureReason = 'unsupported' | 'not-allowed' | 'unavailable';

export type MicrophoneAccessResult =
  | { ok: true }
  | { ok: false; reason: MicrophoneAccessFailureReason };

/** Prompt for mic access in the user-gesture handler before SpeechRecognition.start(). */
export async function requestMicrophoneAccess(): Promise<MicrophoneAccessResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (error) {
    const name = error instanceof DOMException ? error.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return { ok: false, reason: 'not-allowed' };
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return { ok: false, reason: 'unavailable' };
    }
    return { ok: false, reason: 'unavailable' };
  }
}

export function microphoneErrorMessage(reason: MicrophoneAccessFailureReason): string {
  switch (reason) {
    case 'not-allowed':
      return 'Microphone blocked. Click the lock icon in your address bar and allow microphone access, then try again.';
    case 'unavailable':
      return 'No microphone found. Connect a mic or use a device with audio input.';
    default:
      return 'Microphone is not supported in this browser. Try Chrome or Edge on desktop/Android.';
  }
}

export function getSpeechRecognitionCtor(): VoiceRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    webkitSpeechRecognition?: VoiceRecognitionCtor;
    SpeechRecognition?: VoiceRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Merge one new speech segment without duplicating overlapping/cumulative text. */
export function mergeTranscriptSegment(base: string, piece: string): string {
  const b = collapseSpaces(base);
  const p = collapseSpaces(piece);
  if (!p) return b;
  if (!b) return p;

  const bl = b.toLowerCase();
  const pl = p.toLowerCase();

  if (bl === pl) return b;
  if (pl.startsWith(bl)) return p;
  if (bl.startsWith(pl)) return b;
  if (bl.endsWith(pl)) return b;
  if (bl.includes(pl)) return b;

  // Word-boundary overlap: "car repair" + "repair service" → "car repair service"
  const bWords = b.split(' ');
  const pWords = p.split(' ');
  for (let overlap = Math.min(bWords.length, pWords.length); overlap > 0; overlap--) {
    const bTail = bWords.slice(-overlap).join(' ').toLowerCase();
    const pHead = pWords.slice(0, overlap).join(' ').toLowerCase();
    if (bTail === pHead) {
      return collapseSpaces(b + ' ' + pWords.slice(overlap).join(' '));
    }
  }

  return collapseSpaces(b + ' ' + p);
}

/** Drop N consecutive repeats of the same phrase (2×, 3×, …). */
function dedupeRepeatedPhrase(text: string): string {
  const normalized = collapseSpaces(text);
  if (!normalized) return '';

  const words = normalized.split(' ');
  const maxPhraseLen = Math.floor(words.length / 2);

  for (let phraseLen = maxPhraseLen; phraseLen >= 1; phraseLen--) {
    if (words.length % phraseLen !== 0) continue;

    const phrase = words.slice(0, phraseLen).join(' ');
    const repeatCount = words.length / phraseLen;
    if (repeatCount < 2) continue;

    let allMatch = true;
    for (let r = 1; r < repeatCount; r++) {
      const chunk = words.slice(r * phraseLen, (r + 1) * phraseLen).join(' ');
      if (chunk.toLowerCase() !== phrase.toLowerCase()) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return phrase;
  }

  return normalized;
}

/** Remove glued duplicate phrases (e.g. "car repaircar repair" → "car repair"). */
function dedupeGluedPhrases(text: string): string {
  const trimmed = collapseSpaces(text);
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
  const deGlued = dedupeGluedPhrases(collapseSpaces(text));
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

  return dedupeRepeatedPhrase(out.join(' '));
}

/** Merge result segments from one onresult event (handles cumulative & duplicate segments). */
export function transcriptFromResults(
  results: VoiceRecognitionEventLike['results']
): string {
  let merged = '';
  for (let i = 0; i < results.length; i++) {
    const piece = results[i]?.[0]?.transcript ?? '';
    if (!piece) continue;
    merged = mergeTranscriptSegment(merged, piece);
  }
  return normalizeVoiceTranscript(merged);
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
