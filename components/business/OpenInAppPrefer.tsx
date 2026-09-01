'use client';

import { useEffect, useState } from 'react';

function isMobileUa() {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function appDeepLink(slug: string) {
  return `finderb://business/${encodeURIComponent(slug)}`;
}

function androidAppLinkIntent(slug: string) {
  const encoded = encodeURIComponent(slug);
  const fallback = encodeURIComponent(`https://finderb.com/business/${slug}`);
  return `intent://finderb.com/business/${encoded}#Intent;scheme=https;package=com.finderb.app;S.browser_fallback_url=${fallback};end`;
}

type Props = {
  slug: string;
};

/**
 * Prefer the installed native app for shared business profile links.
 * Verified Android App Links open the app before this page loads.
 * This banner/intent is the fallback when the user is already in a mobile browser.
 */
export default function OpenInAppPrefer({ slug }: Props) {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!slug || typeof window === 'undefined') return;
    if (!isMobileUa()) return;

    const storageKey = `finderb_open_in_app_dismissed_${slug}`;
    try {
      if (sessionStorage.getItem(storageKey) === '1') {
        setDismissed(true);
        return;
      }
    } catch {
      // ignore
    }

    setShowBanner(true);

    const started = Date.now();
    const isAndroid = /Android/i.test(navigator.userAgent);
    const target = isAndroid ? androidAppLinkIntent(slug) : appDeepLink(slug);

    const timer = window.setTimeout(() => {
      try {
        window.location.href = target;
      } catch {
        // ignore
      }
    }, 400);

    const visibility = () => {
      if (document.hidden && Date.now() - started < 2500) {
        try {
          sessionStorage.setItem(storageKey, '1');
        } catch {
          // ignore
        }
      }
    };
    document.addEventListener('visibilitychange', visibility);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [slug]);

  if (!showBanner || dismissed) return null;

  const openApp = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    window.location.href = isAndroid ? androidAppLinkIntent(slug) : appDeepLink(slug);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`finderb_open_in_app_dismissed_${slug}`, '1');
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-[60] px-3 sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-stone-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-900">Open in FinderB app</p>
          <p className="text-xs text-stone-500">Faster on your phone when the app is installed</p>
        </div>
        <button
          type="button"
          onClick={openApp}
          className="shrink-0 rounded-full bg-[#215481] px-3.5 py-2 text-xs font-semibold text-white"
        >
          Open app
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 px-1 text-lg leading-none text-stone-400"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
