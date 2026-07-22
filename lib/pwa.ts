export const PWA_DISMISS_KEY = 'finderb-pwa-install-dismissed-until';
export const PWA_INSTALLED_KEY = 'finderb-pwa-installed';
export const PWA_DISMISS_DAYS = 2;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type InstallPromptListener = (event: BeforeInstallPromptEvent | null) => void;

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let installPromptListeners = new Set<InstallPromptListener>();
let captureInitialized = false;

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    nav.standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

export function markPwaInstalled() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function wasPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isIosSafari(): boolean {
  if (!isIosDevice() || typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isOtherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return !isOtherIosBrowser;
}

/** Call once early so we never miss Chrome's beforeinstallprompt. */
export function initInstallPromptCapture() {
  if (typeof window === 'undefined' || captureInitialized) return;
  captureInitialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    installPromptListeners.forEach((listener) => listener(deferredInstallPrompt));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    markPwaInstalled();
    installPromptListeners.forEach((listener) => listener(null));
  });

  if (isStandaloneMode()) {
    markPwaInstalled();
  }
}

export function getDeferredInstallPrompt() {
  return deferredInstallPrompt;
}

export function subscribeInstallPrompt(listener: InstallPromptListener) {
  initInstallPromptCapture();
  installPromptListeners.add(listener);
  listener(deferredInstallPrompt);
  return () => {
    installPromptListeners.delete(listener);
  };
}

export function clearDeferredInstallPrompt() {
  deferredInstallPrompt = null;
  installPromptListeners.forEach((listener) => listener(null));
}

export async function isPwaAlreadyInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (isStandaloneMode()) {
    markPwaInstalled();
    return true;
  }
  if (wasPwaInstalled()) return true;

  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ id?: string; platform?: string; url?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps === 'function') {
    try {
      const apps = await nav.getInstalledRelatedApps();
      if (apps?.length) {
        markPwaInstalled();
        return true;
      }
    } catch {
      /* unsupported / permission */
    }
  }

  return false;
}

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandaloneMode() || wasPwaInstalled()) return false;

  const dismissedUntil = localStorage.getItem(PWA_DISMISS_KEY);
  if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
    return false;
  }

  return isMobileDevice();
}

export function dismissInstallPrompt(days = PWA_DISMISS_DAYS) {
  const until = Date.now() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(PWA_DISMISS_KEY, String(until));
}

export const PWA_COPY = {
  brandName: 'FinderB',
  bar: {
    title: 'Install FinderB Web App',
    subtitle: 'Quick access to local services near you',
  },
  modal: {
    title: 'Install our Web App for the best experience',
    subtitle:
      'Get instant access to verified businesses, search, and updates — right from your home screen.',
  },
  install: 'Install',
  installNow: 'Install Web App',
  installing: 'Installing…',
  later: 'Maybe later',
  dismiss: "Don't show again",
  benefit1: 'One-tap access from your home screen',
  benefit2: 'Faster loading & app-like experience',
  benefit3: 'Find verified services in 300+ cities',
  ios: {
    step1: 'Tap the Share button at the bottom of Safari',
    step2: 'Scroll and tap "Add to Home Screen"',
    step3: 'Tap Add — FinderB will appear on your home screen',
    installCta: 'Add to Home Screen',
  },
  androidFallback:
    'Open your browser menu (⋮) and tap "Install app" or "Add to Home screen".',
} as const;
