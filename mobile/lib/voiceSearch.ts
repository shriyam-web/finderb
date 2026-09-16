import { Alert, Platform } from 'react-native';

type VoiceResult =
  | {
      ok: true;
      transcript: string;
    }
  | {
      ok: false;
      error: string;
    };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult:
    | ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getWebSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return null;
  const w = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function mapSpeechError(code?: string, message?: string): string {
  switch (code) {
    case 'aborted':
    case 'no-speech':
    case 'speech-timeout':
      return 'No speech detected. Try again.';
    case 'not-allowed':
      return 'Microphone permission denied. Allow mic access and retry.';
    case 'audio-capture':
      return 'Could not access the microphone. Check device settings.';
    case 'network':
      return 'Network error during voice search. Check your connection.';
    case 'service-not-allowed':
    case 'client':
      return 'Speech recognition is unavailable on this device.';
    case 'language-not-supported':
      return 'This language is not supported for voice search.';
    case 'busy':
      return 'Voice search is busy. Wait a moment and try again.';
    case 'interrupted':
      return 'Voice search was interrupted. Try again.';
    default:
      return message?.trim() || 'Voice search failed. Please try again.';
  }
}

function startWebVoiceSearch(options?: {
  lang?: string;
  onListeningChange?: (listening: boolean) => void;
}): Promise<VoiceResult> {
  const Recognition = getWebSpeechRecognition();
  if (!Recognition) {
    return Promise.resolve({
      ok: false,
      error: 'Voice search is not supported in this browser.',
    });
  }

  return new Promise((resolve) => {
    const recognition = new Recognition();
    recognition.lang = options?.lang || 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let settled = false;
    const finish = (result: VoiceResult) => {
      if (settled) return;
      settled = true;
      options?.onListeningChange?.(false);
      resolve(result);
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      if (!transcript) {
        finish({ ok: false, error: 'Could not catch that. Try again.' });
        return;
      }
      finish({ ok: true, transcript });
    };

    recognition.onerror = (event) => {
      finish({ ok: false, error: mapSpeechError(event.error) });
    };

    recognition.onend = () => {
      finish({ ok: false, error: 'No speech detected. Try again.' });
    };

    try {
      options?.onListeningChange?.(true);
      recognition.start();
    } catch {
      finish({ ok: false, error: 'Could not start voice search.' });
    }
  });
}

async function startNativeVoiceSearch(options?: {
  lang?: string;
  onListeningChange?: (listening: boolean) => void;
}): Promise<VoiceResult> {
  let ExpoSpeechRecognitionModule: typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;
  try {
    ({ ExpoSpeechRecognitionModule } = await import('expo-speech-recognition'));
  } catch {
    return {
      ok: false,
      error:
        'Voice search needs a native app build. Rebuild the FinderB app to enable it.',
    };
  }

  if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
    return {
      ok: false,
      error:
        'Speech recognition is not available on this device. Install Google app / speech services and try again.',
    };
  }

  const permission =
    await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  if (!permission.granted) {
    return {
      ok: false,
      error: 'Microphone permission denied. Allow mic access and retry.',
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    const subscriptions: { remove: () => void }[] = [];

    const finish = (result: VoiceResult) => {
      if (settled) return;
      settled = true;
      options?.onListeningChange?.(false);
      while (subscriptions.length) {
        subscriptions.pop()?.remove();
      }
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // already stopped
      }
      resolve(result);
    };

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener('result', (event) => {
        const transcript = event.results?.[0]?.transcript?.trim() || '';
        if (!transcript) {
          if (event.isFinal) {
            finish({ ok: false, error: 'Could not catch that. Try again.' });
          }
          return;
        }
        if (event.isFinal) {
          finish({ ok: true, transcript });
        }
      }),
    );

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener('error', (event) => {
        finish({
          ok: false,
          error: mapSpeechError(event.error, event.message),
        });
      }),
    );

    subscriptions.push(
      ExpoSpeechRecognitionModule.addListener('end', () => {
        // If we already resolved from a final result, this is a no-op.
        finish({ ok: false, error: 'No speech detected. Try again.' });
      }),
    );

    try {
      options?.onListeningChange?.(true);
      ExpoSpeechRecognitionModule.start({
        lang: options?.lang || 'en-IN',
        interimResults: false,
        continuous: false,
      });
    } catch {
      finish({ ok: false, error: 'Could not start voice search.' });
    }
  });
}

export function isVoiceSearchAvailable(): boolean {
  if (Platform.OS === 'web') return Boolean(getWebSpeechRecognition());
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition') as typeof import('expo-speech-recognition');
    return Boolean(
      mod.ExpoSpeechRecognitionModule?.isRecognitionAvailable?.(),
    );
  } catch {
    return false;
  }
}

/** Starts speech recognition on native (iOS/Android) and web. */
export async function startVoiceSearch(options?: {
  lang?: string;
  onListeningChange?: (listening: boolean) => void;
}): Promise<VoiceResult> {
  if (Platform.OS === 'web') {
    return startWebVoiceSearch(options);
  }
  return startNativeVoiceSearch(options);
}

export function alertVoiceUnavailable(message: string) {
  Alert.alert('Voice search', message);
}
