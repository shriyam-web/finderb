export const PWA_DISMISS_KEY = 'finderb-pwa-install-dismissed-until';
export const PWA_DISMISS_DAYS = 2;

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
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

export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandaloneMode()) return false;

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

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWA_COPY = {
  brandName: 'FinderB',
  bar: {
    title: 'Install FinderB App',
    subtitle: 'Quick access to local services near you',
  },
  modal: {
    title: 'Install our app for the best experience',
    subtitle:
      'Get instant access to verified businesses, search, and updates — right from your home screen.',
  },
  install: 'Install',
  installNow: 'Install App Now',
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
  },
  androidFallback:
    'Tap the menu (⋮) in your browser and select "Install app" or "Add to Home screen".',
} as const;
