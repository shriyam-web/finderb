'use client';

import { useEffect } from 'react';
import { initInstallPromptCapture, isStandaloneMode, markPwaInstalled } from '@/lib/pwa';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    initInstallPromptCapture();
    if (isStandaloneMode()) {
      markPwaInstalled();
    }

    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);

  return null;
}
